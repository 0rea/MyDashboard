const STORAGE_KEY = "myDashboardData";

const defaultData = {
    goals: [],
    tasks: [],
    schedule: [],
    progress: [],
    history: [],
    settings: {
        username: "My Dashboard",
        theme: "dark"
    }
};

// ==============================
// DATE HELPERS
// ==============================

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==============================
// LOAD DATA
// ==============================

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(defaultData)
        );

        return structuredClone(defaultData);
    }

    try {
        const data = JSON.parse(savedData);

        return {
            ...structuredClone(defaultData),
            ...data,
            goals: Array.isArray(data.goals) ? data.goals : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            schedule: Array.isArray(data.schedule) ? data.schedule : [],
            progress: Array.isArray(data.progress) ? data.progress : [],
            history: Array.isArray(data.history) ? data.history : [],
            settings: {
                ...defaultData.settings,
                ...(data.settings || {})
            }
        };
    } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลได้:", error);

        return structuredClone(defaultData);
    }
}


// ==============================
// SAVE DATA
// ==============================

function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


// ==============================
// CLEAR DATA
// ==============================

function clearData() {
    localStorage.removeItem(STORAGE_KEY);
}


// ==============================
// EXPORT DATA
// ==============================

function exportData(data) {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `mydashboard-backup-${getLocalDateString()}.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ==============================
// IMPORT DATA
// ==============================

function importData(file, callback) {
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const importedData = JSON.parse(
                event.target.result
            );

            const mergedData = {
                ...structuredClone(defaultData),
                ...importedData,
                goals: Array.isArray(importedData.goals)
                    ? importedData.goals
                    : [],
                tasks: Array.isArray(importedData.tasks)
                    ? importedData.tasks
                    : [],
                schedule: Array.isArray(importedData.schedule)
                    ? importedData.schedule
                    : [],
                progress: Array.isArray(importedData.progress)
                    ? importedData.progress
                    : [],
                history: Array.isArray(importedData.history)
                    ? importedData.history
                    : [],
                settings: {
                    ...defaultData.settings,
                    ...(importedData.settings || {})
                }
            };

            saveData(mergedData);

            if (typeof callback === "function") {
                callback(mergedData);
            }

        } catch (error) {
            console.error("Import ไม่สำเร็จ:", error);

            alert("ไฟล์ข้อมูลไม่ถูกต้อง");
        }
    };

    reader.readAsText(file);
}