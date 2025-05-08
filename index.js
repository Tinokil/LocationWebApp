document.addEventListener('DOMContentLoaded', () => {
    const tg = Telegram.WebApp || {
        sendData: data => console.log('Telegram sendData:', data),
        close: () => console.log('Telegram close'),
        ready: () => {},
        expand: () => {}
    };

    let citiesData = [];
    let selectedCities = [];

    // Алгоритм Левенштейна для поиска похожих названий
    const getEditDistance = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j-1] === b[i-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j-1] + cost
                );
            }
        }
        return matrix[b.length][a.length];
    };

    // Загрузка списка городов
    const loadCities = async () => {
        try {
            const response = await fetch('cities.json');
            if (!response.ok) throw new Error();
            citiesData = await response.json();
            initSearch();
        } catch {
            showMessage('Ошибка загрузки городов');
            document.getElementById('citiesList').innerHTML = `
                <div class="no-results">Не удалось загрузить список городов</div>
            `;
        }
    };

    // Инициализация поиска
    const initSearch = () => {
        renderCities();
        document.getElementById('searchInput').focus();
    };

    // Отрисовка городов с учётом поиска и опечаток
    const renderCities = (query = '') => {
        const list = document.getElementById('citiesList');
        list.innerHTML = '';
        
        const processed = citiesData
            .map(city => ({
                name: city,
                distance: getEditDistance(query.toLowerCase(), city.toLowerCase())
            }))
            .filter(city => city.distance <= 2 || city.name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => a.distance - b.distance);

        processed.forEach(city => {
            const item = document.createElement('div');
            item.className = `city-item ${selectedCities.includes(city.name) ? 'selected' : ''}`;
            item.innerHTML = `<span>${city.name}</span><div class="check-icon"></div>`;
            item.addEventListener('click', () => toggleCity(city.name));
            list.appendChild(item);
        });
    };

    // Переключение выбора города
    const toggleCity = (city) => {
        selectedCities = selectedCities.includes(city)
            ? selectedCities.filter(c => c !== city)
            : [...selectedCities, city];
        updateUI();
    };

    // Обновление интерфейса
    const updateUI = () => {
        renderCities(document.getElementById('searchInput').value);
        renderSelectedTags();
        document.getElementById('doneBtn').disabled = !selectedCities.length;
        document.getElementById('selectedCities').classList.toggle('visible', selectedCities.length > 0);
    };

    // Отрисовка выбранных тегов
    const renderSelectedTags = () => {
        const tagsContainer = document.getElementById('selectedTags');
        tagsContainer.innerHTML = selectedCities
            .map(city => `
                <div class="tag">
                    ${city}
                    <span class="remove-tag">×</span>
                </div>
            `).join('');
    };

    // Удаление тега
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag')) {
            const city = e.target.closest('.tag').textContent.replace('×', '').trim();
            toggleCity(city);
        }
    });

    // Отправка данных
    document.getElementById('doneBtn').addEventListener('click', () => {
        tg.sendData(JSON.stringify(selectedCities));
        setTimeout(() => tg.close(), 1000);
    });

    // Поиск с задержкой
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(window.searchTimer);
        window.searchTimer = setTimeout(() => renderCities(e.target.value), 250);
    });

    // Вспомогательные функции
    const showMessage = (text) => {
        const msg = document.createElement('div');
        msg.className = 'error-message';
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    };

    // Инициализация
    tg.ready();
    tg.expand();
    loadCities();
});