import { loadUserInfo, loadChats, loadHistory, currentChatId, createChat, sendMessage } from './api.js';
import { resetModelSelection, updateModel, toggleMenu } from './ui.js';
import { logout } from './logout.js';

// Делаем функции глобальными для использования в HTML
window.logout = logout;
window.toggleMenu = toggleMenu;
window.createChat = createChat;
window.sendMessage = sendMessage;
window.updateModel = updateModel;

window.onload = () => {
    resetModelSelection();
    loadUserInfo();
    loadChats();
    if (currentChatId) loadHistory(currentChatId);
};