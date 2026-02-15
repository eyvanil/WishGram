// Конфигурация
const SUPABASE_URL = 'https://swqynkmgymbjunxqeyxl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cXlua21neW1ianVueHFleXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzk0NTIsImV4cCI6MjA4Njc1NTQ1Mn0.Jw3YLwJtL-3XDNgSjf7Hypu6dP_0WO3IKo9ofIwWUxI';

// Настройки Т-Кассы (Тинькофф)
const TINKOFF_TERMINAL_KEY = 'Test_1654111111111'; // Замени на свой после регистрации
const TINKOFF_PASSWORD = '12345678'; // Для подписи запросов

// Глобальные переменные
let currentWish = null;
let selectedAmount = 1000;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    loadWishes();
    setupEventListeners();
});

// Настройка обработчиков
function setupEventListeners() {
    // Форма добавления желания
    document.getElementById('wishForm').addEventListener('submit', handleWishSubmit);
    
    // Модальное окно
    const modal = document.getElementById('donateModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Выбор суммы
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedAmount = parseInt(e.target.dataset.amount);
            document.getElementById('customAmount').value = '';
        });
    });
    
    // Кастомная сумма
    document.getElementById('customAmount').addEventListener('input', (e) => {
        if (e.target.value) {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
            selectedAmount = parseInt(e.target.value);
        }
    });
    
    // Кнопка оплаты
    document.getElementById('payButton').addEventListener('click', handlePayment);
}

// Загрузка желаний из Supabase
async function loadWishes() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wishes?order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const wishes = await response.json();
        displayWishes(wishes);
        updateStats(wishes);
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Не удалось загрузить желания', 'error');
    }
}

// Отображение желаний
function displayWishes(wishes) {
    const container = document.getElementById('wishesList');
    
    if (!wishes || wishes.length === 0) {
        container.innerHTML = `
            <div class="loading">
                Пока нет желаний. Будь первым! ✨
            </div>
        `;
        return;
    }
    
    container.innerHTML = wishes.map(wish => `
        <div class="wish-card ${wish.is_completed ? 'completed' : ''}">
            <h3 class="wish-title">${escapeHtml(wish.title)}</h3>
            ${wish.description ? `<p class="wish-description">${escapeHtml(wish.description)}</p>` : ''}
            <div class="wish-meta">
                <span class="wish-date">
                    📅 ${new Date(wish.created_at).toLocaleDateString('ru-RU')}
                </span>
                <button 
                    class="fulfill-btn" 
                    onclick="openDonateModal(${JSON.stringify(wish).replace(/"/g, '&quot;')})"
                    ${wish.is_completed ? 'disabled' : ''}
                >
                    ${wish.is_completed ? '✨ Исполнено' : '🎁 Исполнить'}
                </button>
            </div>
        </div>
    `).join('');
}

// Открытие модального окна для доната
function openDonateModal(wish) {
    if (wish.is_completed) {
        showNotification('Это желание уже исполнено!', 'error');
        return;
    }
    
    currentWish = wish;
    document.getElementById('modalWishTitle').textContent = wish.title;
    document.getElementById('donateModal').style.display = 'flex';
    
    // Сброс выбора суммы
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('.amount-btn[data-amount="1000"]').classList.add('selected');
    selectedAmount = 1000;
    document.getElementById('customAmount').value = '';
    document.getElementById('donorName').value = 'Аноним';
}

// Обработка платежа через Т-Кассу
async function handlePayment() {
    if (!currentWish) {
        showNotification('Ошибка: желание не выбрано', 'error');
        return;
    }
    
    const donorName = document.getElementById('donorName').value || 'Аноним';
    
    // Создаем заказ в Т-Кассе
    try {
        // В реальном проекте здесь должен быть запрос к твоему бэкенду
        // Так как у нас чистый JS, используем тестовый режим Т-Кассы
        
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Формируем данные для платежа
        const paymentData = {
            TerminalKey: TINKOFF_TERMINAL_KEY,
            Amount: selectedAmount * 100, // Т-Касса работает в копейках
            OrderId: orderId,
            Description: `Исполнение желания: ${currentWish.title}`,
            DATA: {
                Email: '',
                Phone: ''
            },
            Receipt: {
                Email: '',
                Phone: '',
                Taxation: 'usn_income',
                Items: [{
                    Name: `Подарок: ${currentWish.title}`,
                    Price: selectedAmount * 100,
                    Quantity: 1.0,
                    Amount: selectedAmount * 100,
                    Tax: 'none'
                }]
            }
        };
        
        // В ТЕСТОВОМ РЕЖИМЕ открываем демо-страницу оплаты
        // Для реальной интеграции нужно отправлять запрос на https://securepay.tinkoff.ru/v2/Init
        
        // Тестовая ссылка для демонстрации (замени на реальную интеграцию)
        const testPaymentUrl = `https://securepay.tinkoff.ru/new/${orderId}?amount=${selectedAmount}&title=${encodeURIComponent(currentWish.title)}`;
        
        // Открываем окно оплаты
        const paymentWindow = window.open(testPaymentUrl, '_blank', 'width=800,height=600');
        
        if (paymentWindow) {
            showNotification('Перенаправляем на страницу оплаты...', 'success');
            
            // Сохраняем информацию о платеже (в реальном проекте отправляем на бэкенд)
            console.log('Платеж инициирован:', {
                wish: currentWish,
                amount: selectedAmount,
                donor: donorName,
                orderId: orderId
            });
            
            // Через некоторое время проверяем статус (имитация)
            setTimeout(() => {
                if (confirm('Оплата прошла успешно? (для теста)')) {
                    markWishAsCompleted(currentWish.id, donorName);
                }
            }, 10000);
            
        } else {
            showNotification('Не удалось открыть окно оплаты. Разрешите всплывающие окна.', 'error');
        }
        
    } catch (error) {
        console.error('Ошибка платежа:', error);
        showNotification('Ошибка при создании платежа', 'error');
    }
    
    document.getElementById('donateModal').style.display = 'none';
}

// Отметить желание как исполненное
async function markWishAsCompleted(wishId, donorName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wishes?id=eq.${wishId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_completed: true,
                donor_name: donorName
            })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления');
        
        showNotification('Спасибо! Желание исполнено ✨', 'success');
        loadWishes(); // Перезагружаем список
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при обновлении статуса', 'error');
    }
}

// Отправка нового желания
async function handleWishSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('wishTitle').value.trim();
    const description = document.getElementById('wishDesc').value.trim();
    
    if (!title) {
        showNotification('Напишите ваше желание', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                title: title,
                description: description || null,
                is_completed: false
            })
        });
        
        if (!response.ok) throw new Error('Ошибка сохранения');
        
        // Очищаем форму
        document.getElementById('wishTitle').value = '';
        document.getElementById('wishDesc').value = '';
        
        showNotification('Желание опубликовано! ✨', 'success');
        loadWishes(); // Перезагружаем список
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Не удалось опубликовать желание', 'error');
    }
}

// Обновление статистики
function updateStats(wishes) {
    const total = wishes.length;
    const completed = wishes.filter(w => w.is_completed).length;
    const statsEl = document.getElementById('stats');
    
    if (statsEl) {
        statsEl.textContent = `Всего: ${total} • Исполнено: ${completed}`;
    }
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Экранирование HTML для безопасности
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}