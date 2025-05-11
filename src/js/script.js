import { loadUserInfo, loadChats, loadHistory, currentChatId, createChat, sendMessage, renameChat, deleteChat } from './api.js';
import { resetModelSelection, updateModel, toggleMenu, openModal, closeModal, handleHashNavigation} from './ui.js';
import { logout } from './logout.js';

// Делаем функции глобальными для использования в HTML
window.logout = logout;
window.toggleMenu = toggleMenu;
window.createChat = createChat;
window.sendMessage = sendMessage;
window.updateModel = updateModel;
window.renameChat = renameChat;
window.deleteChat = deleteChat;
window.closeModal = closeModal;

window.onload = () => {
    resetModelSelection();
    loadUserInfo();
    loadChats();
    if (currentChatId) loadHistory(currentChatId);
};

window.onhashchange = handleHashNavigation;