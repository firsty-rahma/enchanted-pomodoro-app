export function storeItem(timerData) {
    localStorage.setItem("timer_data", JSON.stringify(timerData));
}

export function storeData(allData) {
    localStorage.setItem("all_data", JSON.stringify(allData));
}

export function getLatestData() {
    const storedData = localStorage.getItem("all_data");
    return storedData ? JSON.parse(storedData):[]
}