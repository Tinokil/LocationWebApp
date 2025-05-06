document.addEventListener('DOMContentLoaded', () => {
    const tg = Telegram.WebApp || {
        sendData: data => console.log('Telegram sendData:', data),
        close: () => console.log('Telegram close'),
        ready: () => {},
        expand: () => {}
    };

    let citiesData = [];
    let selectedCities = [];

    const loadCities = async () => {
        try {
            const response = await fetch('cities.json');
            if (!response.ok) throw new Error();
            citiesData = await response.json();
            initSearch();
        } catch {
            showMessage('Ошибка загрузки городов');
            document.getElementById('citiesList').innerHTML = `
                <div class="no-results">
                    Не удалось загрузить список городов
                </div>
            `;
        }
    };

    const initSearch = () => {
        renderCities();
        document.getElementById('searchInput').focus();
    };

    const renderCities = (filter = '') => {
        const list = document.getElementById('citiesList');
        list.innerHTML = '';
        
        const filtered = citiesData
            .filter(city => city.toLowerCase().includes(filter.toLowerCase()))
            .sort((a, b) => a.localeCompare(b));

        filtered.forEach(city => {
            const item = document.createElement('div');
            item.className = `city-item ${selectedCities.includes(city) ? 'selected' : ''}`;
            item.innerHTML = `
                <span>${city}</span>
                <div class="check-icon"></div>
            `;
            item.addEventListener('click', () => toggleCity(city));
            list.appendChild(item);
        });
    };

    const toggleCity = (city) => {
        selectedCities = selectedCities.includes(city)
            ? selectedCities.filter(c => c !== city)
            : [...selectedCities, city];
        updateUI();
    };

    const updateUI = () => {
        renderCities(document.getElementById('searchInput').value);
        renderSelectedTags();
        document.getElementById('doneBtn').disabled = !selectedCities.length;
        document.getElementById('selectedCities').classList.toggle('visible', selectedCities.length > 0);
    };

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

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag')) {
            const city = e.target.closest('.tag').textContent.replace('×', '').trim();
            toggleCity(city);
        }
    });

    document.getElementById('doneBtn').addEventListener('click', () => {
        tg.sendData(JSON.stringify(selectedCities));
        setTimeout(() => tg.close(), 1000);
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(window.searchTimer);
        window.searchTimer = setTimeout(() => renderCities(e.target.value), 250);
    });

    const showMessage = (text, isError = true) => {
        const msg = document.createElement('div');
        msg.className = `error-message ${isError ? '' : 'success'}`;
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    };

    tg.ready();
    tg.expand();
    loadCities();
});