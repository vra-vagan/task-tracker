let currentUser = null;
let allTasks = [];
let lastVisible = null;
let hasMore = true;
let isLoading = false;
let deadlineTimerInterval = null;
let appInitialized = false;

export const getCurrentUser = () => currentUser;
export const getAllTasks = () => allTasks;
export const getLastVisible = () => lastVisible;
export const getHasMore = () => hasMore;
export const getIsLoading = () => isLoading;
export const getDeadlineTimerInterval = () => deadlineTimerInterval;
export const getAppInitialized = () => appInitialized;

export const setCurrentUser = (value) => {
    currentUser = value;
    return currentUser;
};

export const setAllTasks = (value) => {
    allTasks = value;
    return allTasks;
};

export const setLastVisible = (value) => {
    lastVisible = value;
    return lastVisible;
};

export const setHasMore = (value) => {
    hasMore = value;
    return hasMore;
};

export const setIsLoading = (value) => {
    isLoading = value;
    return isLoading;
};

export const setDeadlineTimerInterval = (value) => {
    deadlineTimerInterval = value;
    return deadlineTimerInterval;
};

export const setAppInitialized = (value) => {
    appInitialized = value;
    return appInitialized;
};
