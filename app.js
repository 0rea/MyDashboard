// =========================================
// GLOBAL DATA
// =========================================

let dashboardData = normalizeDashboardData(loadData());

let currentCalendarDate = new Date();

let selectedDate = getLocalDateString();


// =========================================
// DATA NORMALIZATION
// =========================================

function createSafeId(prefix = "item") {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );

}


function normalizeDashboardData(data) {

    const normalized =
        data && typeof data === "object"
            ? data
            : {};


    if (!Array.isArray(normalized.goals)) {
        normalized.goals = [];
    }

    if (!Array.isArray(normalized.tasks)) {
        normalized.tasks = [];
    }

    if (!Array.isArray(normalized.schedule)) {
        normalized.schedule = [];
    }

    if (!Array.isArray(normalized.progress)) {
        normalized.progress = [];
    }

    if (!Array.isArray(normalized.history)) {
        normalized.history = [];
    }


    normalized.goals =
        normalized.goals.map(
            goal => ({
                id:
                    String(
                        goal.id ||
                        createSafeId("goal")
                    ),
                title:
                    String(
                        goal.title ||
                        "Untitled Goal"
                    ),
                progress:
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(
                                goal.progress
                            ) || 0
                        )
                    ),
                createdAt:
                    goal.createdAt ||
                    new Date().toISOString()
            })
        );


    normalized.tasks =
        normalized.tasks.map(
            task => ({
                id:
                    String(
                        task.id ||
                        createSafeId("task")
                    ),
                title:
                    String(
                        task.title ||
                        "Untitled Task"
                    ),
                completed:
                    Boolean(task.completed),
                priority:
                    ["high", "medium", "low"].includes(
                        task.priority
                    )
                        ? task.priority
                        : "medium",
                status:
                    task.completed
                        ? "done"
                        : (task.status || "todo"),
                dueDate:
                    task.dueDate || null,
                time:
                    task.time || null,
                goalId:
                    task.goalId || null,
                note:
                    String(task.note || ""),
                estimatedMinutes:
                    Number(task.estimatedMinutes) > 0
                        ? Number(task.estimatedMinutes)
                        : null,
                createdAt:
                    task.createdAt ||
                    new Date().toISOString()
            })
        );


    if (!normalized.settings) {
        normalized.settings = {};
    }


    saveData(normalized);

    return normalized;

}


// =========================================
// INITIALIZE
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    initializeNavigation();

    updateHeader();

    renderDashboard();

    renderCalendar();

    renderGoalsPage();

    renderTasksPage();

    renderProgressPage();

});


// =========================================
// NAVIGATION
// =========================================

function initializeNavigation() {

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const section = item.dataset.section;

            showSection(section);

        });

    });

}


function showSection(sectionName) {

    const sections = document.querySelectorAll(".page-section");

    sections.forEach(section => {

        section.classList.remove("active");

    });


    const target = document.getElementById(
        `${sectionName}Section`
    );

    if (target) {

        target.classList.add("active");

    }


    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );

    });


    const titles = {
        dashboard: "Dashboard",
        calendar: "Calendar",
        goals: "Goals",
        tasks: "Tasks",
        progress: "Progress",
        settings: "Settings"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionName] || "Dashboard";


    if (sectionName === "calendar") {

        renderCalendar();

    }

    if (sectionName === "goals") {

        renderGoalsPage();

    }

    if (sectionName === "tasks") {

        renderTasksPage();

    }

    if (sectionName === "progress") {

        renderProgressPage();

    }

}


// =========================================
// HEADER
// =========================================

function updateHeader() {

    const now = new Date();

    const dateText = now.toLocaleDateString(
        "th-TH",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    const dayText = now.toLocaleDateString(
        "en-US",
        {
            weekday: "long"
        }
    );


    document.getElementById("todayDate").textContent =
        dateText;

    document.getElementById("todayDay").textContent =
        dayText;


    document.getElementById("dashboardDateText").textContent =
        dateText;


    const hour = now.getHours();

    let greeting = "Good day 👋";

    if (hour < 12) {

        greeting = "Good morning ☀️";

    } else if (hour < 18) {

        greeting = "Good afternoon 🌤️";

    } else {

        greeting = "Good evening 🌙";

    }

    document.getElementById(
        "dashboardGreeting"
    ).textContent = greeting;

}


// =========================================
// DASHBOARD
// =========================================

function renderDashboard() {

    renderOverview();

    renderTodayTasks();

    renderGoals();

    renderFocus();

    renderUpcoming();

    renderDailyScore();

}


// =========================================
// OVERVIEW
// =========================================

function renderOverview() {

    const today = getLocalDateString();

    const todayTasks = dashboardData.tasks.filter(
        task => task.dueDate === today
    );

    const completed = todayTasks.filter(
        task => task.completed
    );


    document.getElementById("goalCount").textContent =
        dashboardData.goals.length;


    document.getElementById("taskCount").textContent =
        todayTasks.length;


    document.getElementById("completedCount").textContent =
        completed.length;


    document.getElementById("overallProgress").textContent =
        `${calculateOverallGoalProgress()}%`;

}


// =========================================
// GOALS
// =========================================

function renderGoals() {

    const container =
        document.getElementById("goalList");

    if (!dashboardData.goals.length) {

        container.innerHTML = `
            <div class="empty-state">
                ยังไม่มี Goal
                <br>
                เริ่มเพิ่มเป้าหมายแรกของคุณได้เลย
            </div>
        `;

        return;

    }


    container.innerHTML =
        dashboardData.goals
            .map(goal => createGoalHTML(goal))
            .join("");

}


function createGoalHTML(goal) {

    const progress = Math.max(
        0,
        Math.min(100, Number(goal.progress) || 0)
    );


    return `
        <div class="goal-item">

            <div class="goal-top">

                <div class="goal-title">
                    ${escapeHTML(goal.title)}
                </div>

                <div class="goal-percent">
                    ${progress}%
                </div>

            </div>

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width: ${progress}%"
                ></div>

            </div>

            <div class="goal-controls">

                <button
                    class="goal-control-button"
                    onclick="changeGoalProgress('${goal.id}', -10)"
                >
                    −
                </button>

                <button
                    class="goal-control-button"
                    onclick="changeGoalProgress('${goal.id}', 10)"
                >
                    +
                </button>

                <button
                    class="goal-control-button"
                    onclick="deleteGoal('${goal.id}')"
                >
                    ×
                </button>

            </div>

        </div>
    `;

}


function showGoalForm() {

    const form =
        document.getElementById("goalForm");

    form.classList.remove("hidden");

    document.getElementById(
        "goalTitleInput"
    ).focus();

}


function hideGoalForm() {

    document
        .getElementById("goalForm")
        .classList.add("hidden");

}


function addGoal() {

    const input =
        document.getElementById("goalTitleInput");

    const title = input.value.trim();

    if (!title) {

        alert("กรุณาใส่ชื่อ Goal");

        return;

    }


    const goal = {

        id: createSafeId("goal"),

        title,

        progress: 0,

        createdAt: new Date().toISOString()

    };


    dashboardData.goals.push(goal);

    saveData(dashboardData);


    input.value = "";

    hideGoalForm();

    refreshEverything();

}


function changeGoalProgress(id, amount) {

    const goal =
        dashboardData.goals.find(
            item => item.id === id
        );

    if (!goal) return;


    goal.progress = Math.max(
        0,
        Math.min(
            100,
            (Number(goal.progress) || 0) + amount
        )
    );


    saveData(dashboardData);

    refreshEverything();

}


function deleteGoal(id) {

    const normalizedId = String(id);

    const goal =
        dashboardData.goals.find(
            item =>
                String(item.id) === normalizedId
        );


    if (!goal) {

        alert("ไม่พบ Goal ที่ต้องการลบ");

        return;

    }


    const confirmed =
        confirm(
            `ต้องการลบ Goal "${goal.title}" หรือไม่?`
        );


    if (!confirmed) return;


    dashboardData.goals =
        dashboardData.goals.filter(
            item =>
                String(item.id) !== normalizedId
        );


    dashboardData.tasks =
        dashboardData.tasks.map(
            task =>
                String(task.goalId) === normalizedId
                    ? {
                        ...task,
                        goalId: null
                    }
                    : task
        );


    saveData(dashboardData);

    refreshEverything();

}


// =========================================
// TASKS
// =========================================

function renderTodayTasks() {

    const container =
        document.getElementById("taskList");

    const today =
        getLocalDateString();


    const tasks =
        dashboardData.tasks
            .filter(task => task.dueDate === today)
            .sort(sortTasks);


    if (!tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                วันนี้ยังไม่มี Task
            </div>
        `;

        return;

    }


    container.innerHTML =
        tasks
            .map(task => createTaskHTML(task))
            .join("");

}


function createTaskHTML(task) {

    const priorityText = {
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW"
    };


    return `
        <div
            class="task-item task-clickable"
            data-task-id="${escapeHTML(task.id)}"
            onclick="openTaskDetails(this)"
        >

            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${task.id}'); event.stopPropagation()"
                onclick="event.stopPropagation()"
            >

            <div class="task-content">

                <div
                    class="task-title ${
                        task.completed ? "completed" : ""
                    }"
                >
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">
                    ${
                        task.time
                            ? `⏰ ${task.time}`
                            : "ไม่มีเวลา"
                    }
                </div>

            </div>

            <div
                class="priority ${
                    task.priority === "high"
                        ? "priority-high"
                        : ""
                }"
            >
                ${priorityText[task.priority] || "MEDIUM"}
            </div>

            <button
                type="button"
                class="delete-button"
                data-task-id="${escapeHTML(task.id)}"
                onclick="event.stopPropagation(); deleteTask(this)"
            >
                ×
            </button>

        </div>
    `;

}


// =========================================
// TASK FORM
// =========================================

function showTaskForm(date = null) {

    /*
        ถ้าเปิดจากหน้า Tasks
        ให้ใช้ Add Task Modal ของหน้า Tasks โดยตรง
    */

    const tasksSection =
        document.getElementById("tasksSection");

    if (
        tasksSection &&
        tasksSection.classList.contains("active")
    ) {

        showTasksAddModal(date);

        return;

    }


    /*
        ถ้าเปิดจาก Dashboard / Calendar
        ให้ใช้ Form เดิม
    */

    const form =
        document.getElementById("taskForm");

    if (!form) return;

    form.classList.remove("hidden");


    const dateInput =
        document.getElementById("taskDateInput");


    dateInput.value =
        date ||
        selectedDate ||
        getLocalDateString();


    document.getElementById(
        "taskTitleInput"
    ).focus();

}


function hideTaskForm() {

    const form =
        document.getElementById("taskForm");

    if (!form) return;

    form.classList.add("hidden");

}


// =========================================
// TASKS PAGE ADD MODAL
// =========================================

function showTasksAddModal(date = null) {

    let modal =
        document.getElementById("tasksAddModal");


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "tasksAddModal";


        modal.innerHTML = `

            <div
                style="
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,.72);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 9999;
                "
                onclick="if(event.target === this) closeTasksAddModal()"
            >

                <div
                    style="
                        width: min(520px, 100%);
                        max-height: 90vh;
                        overflow-y: auto;
                        background: #111;
                        border: 1px solid #333;
                        border-radius: 16px;
                        padding: 24px;
                        box-sizing: border-box;
                        color: #fff;
                    "
                >

                    <div
                        style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-bottom: 20px;
                        "
                    >

                        <div>

                            <div
                                style="
                                    font-size: 20px;
                                    font-weight: 700;
                                "
                            >
                                Add Task
                            </div>

                            <div
                                style="
                                    font-size: 12px;
                                    opacity: .55;
                                    margin-top: 4px;
                                "
                            >
                                เพิ่มงานใหม่
                            </div>

                        </div>

                        <button
                            type="button"
                            onclick="closeTasksAddModal()"
                            style="
                                border: 0;
                                background: transparent;
                                color: #fff;
                                font-size: 26px;
                                cursor: pointer;
                            "
                        >
                            ×
                        </button>

                    </div>


                    <div style="margin-bottom: 14px;">

                        <label
                            style="
                                display: block;
                                margin-bottom: 7px;
                                font-size: 13px;
                            "
                        >
                            Task
                        </label>

                        <input
                            id="tasksAddTitle"
                            type="text"
                            placeholder="เช่น ทำรายงานวิชา Software Engineering"
                            style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 11px 12px;
                                border-radius: 9px;
                                border: 1px solid #333;
                                background: #1b1b1b;
                                color: #fff;
                            "
                        >

                    </div>


                    <div
                        style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px;
                            margin-bottom: 14px;
                        "
                    >

                        <div>

                            <label
                                style="
                                    display: block;
                                    margin-bottom: 7px;
                                    font-size: 13px;
                                "
                            >
                                Date
                            </label>

                            <input
                                id="tasksAddDate"
                                type="date"
                                style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 11px 12px;
                                    border-radius: 9px;
                                    border: 1px solid #333;
                                    background: #1b1b1b;
                                    color: #fff;
                                "
                            >

                        </div>


                        <div>

                            <label
                                style="
                                    display: block;
                                    margin-bottom: 7px;
                                    font-size: 13px;
                                "
                            >
                                Time
                            </label>

                            <input
                                id="tasksAddTime"
                                type="time"
                                style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 11px 12px;
                                    border-radius: 9px;
                                    border: 1px solid #333;
                                    background: #1b1b1b;
                                    color: #fff;
                                "
                            >

                        </div>

                    </div>


                    <div
                        style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px;
                            margin-bottom: 14px;
                        "
                    >

                        <div>

                            <label
                                style="
                                    display: block;
                                    margin-bottom: 7px;
                                    font-size: 13px;
                                "
                            >
                                Priority
                            </label>

                            <select
                                id="tasksAddPriority"
                                style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 11px 12px;
                                    border-radius: 9px;
                                    border: 1px solid #333;
                                    background: #1b1b1b;
                                    color: #fff;
                                "
                            >

                                <option value="high">
                                    High
                                </option>

                                <option
                                    value="medium"
                                    selected
                                >
                                    Medium
                                </option>

                                <option value="low">
                                    Low
                                </option>

                            </select>

                        </div>


                        <div>

                            <label
                                style="
                                    display: block;
                                    margin-bottom: 7px;
                                    font-size: 13px;
                                "
                            >
                                Goal
                            </label>

                            <select
                                id="tasksAddGoal"
                                style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 11px 12px;
                                    border-radius: 9px;
                                    border: 1px solid #333;
                                    background: #1b1b1b;
                                    color: #fff;
                                "
                            >

                            </select>

                        </div>

                    </div>


                    <div style="margin-bottom: 14px;">

                        <label
                            style="
                                display: block;
                                margin-bottom: 7px;
                                font-size: 13px;
                            "
                        >
                            Estimated Duration (minutes)
                        </label>

                        <input
                            id="tasksAddDuration"
                            type="number"
                            min="1"
                            placeholder="เช่น 60"
                            style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 11px 12px;
                                border-radius: 9px;
                                border: 1px solid #333;
                                background: #1b1b1b;
                                color: #fff;
                            "
                        >

                    </div>


                    <div style="margin-bottom: 20px;">

                        <label
                            style="
                                display: block;
                                margin-bottom: 7px;
                                font-size: 13px;
                            "
                        >
                            Note
                        </label>

                        <textarea
                            id="tasksAddNote"
                            rows="4"
                            placeholder="รายละเอียดเพิ่มเติม..."
                            style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 11px 12px;
                                border-radius: 9px;
                                border: 1px solid #333;
                                background: #1b1b1b;
                                color: #fff;
                                resize: vertical;
                            "
                        ></textarea>

                    </div>


                    <div
                        style="
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                        "
                    >

                        <button
                            type="button"
                            onclick="closeTasksAddModal()"
                            style="
                                padding: 10px 18px;
                                border-radius: 9px;
                                border: 1px solid #444;
                                background: transparent;
                                color: #fff;
                                cursor: pointer;
                            "
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            onclick="addTaskFromTasksPage()"
                            style="
                                padding: 10px 20px;
                                border-radius: 9px;
                                border: 0;
                                background: #fff;
                                color: #000;
                                font-weight: 700;
                                cursor: pointer;
                            "
                        >
                            Add Task
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(modal);

    }


    const dateInput =
        document.getElementById("tasksAddDate");


    dateInput.value =
        date ||
        selectedDate ||
        getLocalDateString();


    const goalSelect =
        document.getElementById("tasksAddGoal");


    goalSelect.innerHTML =
        `<option value="">No Goal</option>` +
        dashboardData.goals
            .map(
                goal => `
                    <option value="${escapeHTML(goal.id)}">
                        ${escapeHTML(goal.title)}
                    </option>
                `
            )
            .join("");


    document.getElementById(
        "tasksAddTitle"
    ).value = "";

    document.getElementById(
        "tasksAddTime"
    ).value = "";

    document.getElementById(
        "tasksAddPriority"
    ).value = "medium";

    document.getElementById(
        "tasksAddGoal"
    ).value = "";

    document.getElementById(
        "tasksAddDuration"
    ).value = "";

    document.getElementById(
        "tasksAddNote"
    ).value = "";


    modal.style.display = "block";


    setTimeout(() => {

        document.getElementById(
            "tasksAddTitle"
        ).focus();

    }, 0);

}


function closeTasksAddModal() {

    const modal =
        document.getElementById("tasksAddModal");

    if (!modal) return;

    modal.style.display = "none";

}


function addTaskFromTasksPage() {

    const title =
        document
            .getElementById("tasksAddTitle")
            .value
            .trim();


    const dueDate =
        document.getElementById(
            "tasksAddDate"
        ).value;


    const time =
        document.getElementById(
            "tasksAddTime"
        ).value;


    const priority =
        document.getElementById(
            "tasksAddPriority"
        ).value;


    const goalId =
        document.getElementById(
            "tasksAddGoal"
        ).value ||
        null;


    const durationValue =
        Number(
            document.getElementById(
                "tasksAddDuration"
            ).value
        );


    const note =
        document.getElementById(
            "tasksAddNote"
        ).value
        .trim();


    if (!title) {

        alert("กรุณาใส่ชื่อ Task");

        return;

    }


    if (!dueDate) {

        alert("กรุณาเลือกวันที่");

        return;

    }


    const task = {

        id: createSafeId("task"),

        title,

        completed: false,

        priority,

        status: "todo",

        dueDate,

        time: time || null,

        goalId,

        note,

        estimatedMinutes:
            durationValue > 0
                ? durationValue
                : null,

        createdAt:
            new Date().toISOString()

    };


    dashboardData.tasks.push(task);

    saveData(dashboardData);


    closeTasksAddModal();

    refreshEverything();


    /*
        ถ้า Task ถูกเพิ่มเป็นวันอื่น
        ให้แสดงข้อมูลใหม่ในหน้า Tasks ทันที
    */

    if (
        document
            .getElementById("tasksSection")
            ?.classList
            .contains("active")
    ) {

        renderTasksPage();

    }

}


// =========================================
// ORIGINAL DASHBOARD / CALENDAR ADD TASK
// =========================================

function addTask() {

    const title =
        document
            .getElementById("taskTitleInput")
            .value
            .trim();


    const dueDate =
        document.getElementById(
            "taskDateInput"
        ).value;


    const time =
        document.getElementById(
            "taskTimeInput"
        ).value;


    const priority =
        document.getElementById(
            "taskPriorityInput"
        ).value;


    if (!title) {

        alert("กรุณาใส่ชื่อ Task");

        return;

    }


    if (!dueDate) {

        alert("กรุณาเลือกวันที่");

        return;

    }


    const task = {

        id: createSafeId("task"),

        title,

        completed: false,

        priority,

        status: "todo",

        dueDate,

        time: time || null,

        goalId: null,

        note: "",

        estimatedMinutes: null,

        createdAt: new Date().toISOString()

    };


    dashboardData.tasks.push(task);

    saveData(dashboardData);


    document.getElementById(
        "taskTitleInput"
    ).value = "";

    document.getElementById(
        "taskTimeInput"
    ).value = "";


    hideTaskForm();

    refreshEverything();

}


function toggleTask(id) {

    const task =
        dashboardData.tasks.find(
            item => item.id === id
        );

    if (!task) return;


    task.completed =
        !task.completed;


    task.status =
        task.completed
            ? "done"
            : "todo";


    saveData(dashboardData);

    refreshEverything();

}


function deleteTask(target) {

    const id =
        target && target.dataset
            ? target.dataset.taskId
            : target;

    const normalizedId = String(id ?? "");

    if (!normalizedId) {
        return;
    }


    const taskExists =
        dashboardData.tasks.some(
            task => String(task.id) === normalizedId
        );


    if (!taskExists) {
        return;
    }


    const confirmed = confirm(
        "ต้องการลบ Task นี้หรือไม่?"
    );


    if (!confirmed) {
        return;
    }


    dashboardData.tasks =
        dashboardData.tasks.filter(
            task => String(task.id) !== normalizedId
        );


    saveData(dashboardData);

    refreshEverything();

}


// =========================================
// TASK DETAILS
// =========================================

function getTaskFromTarget(target) {

    const id =
        target && target.dataset
            ? target.dataset.taskId
            : target;

    if (!id) return null;


    return dashboardData.tasks.find(
        task => String(task.id) === String(id)
    ) || null;

}


function openTaskDetails(target) {

    const task = getTaskFromTarget(target);

    if (!task) return;


    const modal =
        document.getElementById("taskDetailModal");


    if (!modal) return;


    document.getElementById("editTaskTitle").value =
        task.title || "";


    document.getElementById("editTaskDate").value =
        task.dueDate || "";


    document.getElementById("editTaskTime").value =
        task.time || "";


    document.getElementById("editTaskPriority").value =
        task.priority || "medium";


    document.getElementById("editTaskStatus").value =
        task.completed
            ? "done"
            : (task.status || "todo");


    const goalSelect =
        document.getElementById("editTaskGoal");


    goalSelect.innerHTML =
        `<option value="">No Goal</option>` +
        dashboardData.goals
            .map(
                goal => `
                    <option value="${escapeHTML(goal.id)}">
                        ${escapeHTML(goal.title)}
                    </option>
                `
            )
            .join("");


    goalSelect.value =
        task.goalId || "";


    document.getElementById(
        "editTaskDuration"
    ).value =
        task.estimatedMinutes || "";


    document.getElementById(
        "editTaskNote"
    ).value =
        task.note || "";


    modal.dataset.taskId =
        String(task.id);


    modal.classList.remove("hidden");


    document.getElementById(
        "editTaskTitle"
    ).focus();

}


function closeTaskDetails() {

    const modal =
        document.getElementById("taskDetailModal");


    if (!modal) return;


    modal.classList.add("hidden");

    delete modal.dataset.taskId;

}


function saveTaskDetails() {

    const modal =
        document.getElementById("taskDetailModal");


    const id =
        modal?.dataset.taskId;


    const task =
        getTaskFromTarget(id);


    if (!task) return;


    const title =
        document
            .getElementById("editTaskTitle")
            .value
            .trim();


    const dueDate =
        document.getElementById(
            "editTaskDate"
        ).value;


    if (!title) {

        alert("กรุณาใส่ชื่อ Task");

        return;

    }


    if (!dueDate) {

        alert("กรุณาเลือกวันที่");

        return;

    }


    const status =
        document.getElementById(
            "editTaskStatus"
        ).value;


    const durationValue =
        Number(
            document.getElementById(
                "editTaskDuration"
            ).value
        );


    task.title =
        title;


    task.dueDate =
        dueDate;


    task.time =
        document.getElementById(
            "editTaskTime"
        ).value ||
        null;


    task.priority =
        document.getElementById(
            "editTaskPriority"
        ).value;


    task.status =
        status;


    task.completed =
        status === "done";


    task.goalId =
        document.getElementById(
            "editTaskGoal"
        ).value ||
        null;


    task.estimatedMinutes =
        durationValue > 0
            ? durationValue
            : null;


    task.note =
        document.getElementById(
            "editTaskNote"
        ).value
        .trim();


    saveData(dashboardData);


    closeTaskDetails();

    refreshEverything();

}


function deleteTaskFromDetails() {

    const modal =
        document.getElementById("taskDetailModal");


    const id =
        modal?.dataset.taskId;


    const task =
        getTaskFromTarget(id);


    if (!task) return;


    closeTaskDetails();

    deleteTask(id);

}


// =========================================
// FOCUS
// =========================================

function renderFocus() {

    const container =
        document.getElementById("focusList");

    const today =
        getLocalDateString();


    const tasks =
        dashboardData.tasks
            .filter(
                task =>
                    task.dueDate === today &&
                    !task.completed
            )
            .sort(sortTasks)
            .slice(0, 3);


    if (!tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                🎉 วันนี้ไม่มี Task ที่ค้างอยู่
            </div>
        `;


        document.getElementById(
            "currentFocus"
        ).textContent =
            "พักได้ หรือเตรียมงานสำหรับวันถัดไป";


        return;

    }


    document.getElementById(
        "currentFocus"
    ).textContent =
        tasks[0].title;


    container.innerHTML =
        tasks
            .map(
                (task, index) => `
                    <div class="focus-item">

                        <div class="focus-number">
                            ${index + 1}
                        </div>

                        <div class="focus-content">

                            <div class="focus-title">
                                ${escapeHTML(task.title)}
                            </div>

                            <div class="focus-meta">
                                ${
                                    task.time
                                        ? `⏰ ${task.time}`
                                        : "ไม่มีเวลาระบุ"
                                }
                                ·
                                ${task.priority}
                            </div>

                        </div>

                    </div>
                `
            )
            .join("");

}


// =========================================
// UPCOMING
// =========================================

function renderUpcoming() {

    const container =
        document.getElementById(
            "upcomingList"
        );


    const today =
        getLocalDateString();


    const upcoming =
        dashboardData.tasks
            .filter(
                task =>
                    !task.completed &&
                    task.dueDate &&
                    task.dueDate >= today
            )
            .sort((a, b) => {

                if (a.dueDate !== b.dueDate) {

                    return a.dueDate.localeCompare(
                        b.dueDate
                    );

                }

                return (a.time || "")
                    .localeCompare(
                        b.time || ""
                    );

            })
            .slice(0, 6);


    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-state">
                ไม่มีงานที่กำลังจะถึง
            </div>
        `;

        return;

    }


    container.innerHTML =
        upcoming
            .map(task => {

                return `
                    <div class="upcoming-item">

                        <div class="upcoming-date">
                            ${formatDate(task.dueDate)}
                            ${
                                task.time
                                    ? ` · ${task.time}`
                                    : ""
                            }
                        </div>

                        <div class="upcoming-title">
                            ${escapeHTML(task.title)}
                        </div>

                        <div class="upcoming-meta">
                            Priority:
                            ${task.priority}
                        </div>

                    </div>
                `;

            })
            .join("");

}


// =========================================
// DAILY SCORE
// =========================================

function renderDailyScore() {

    const today =
        getLocalDateString();


    const tasks =
        dashboardData.tasks.filter(
            task => task.dueDate === today
        );


    if (!tasks.length) {

        document.getElementById(
            "dailyScore"
        ).textContent = "—";

        return;

    }


    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const score =
        Math.round(
            (completed / tasks.length) * 100
        );


    document.getElementById(
        "dailyScore"
    ).textContent = score;

}


// =========================================
// CALENDAR
// =========================================

function renderCalendar() {

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();


    const monthTitle =
        currentCalendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    document.getElementById(
        "calendarMonthTitle"
    ).textContent = monthTitle;


    const grid =
        document.getElementById(
            "calendarGrid"
        );


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    let startDay =
        firstDay.getDay();


    startDay =
        startDay === 0
            ? 6
            : startDay - 1;


    const daysInMonth =
        lastDay.getDate();


    const previousMonthLastDay =
        new Date(
            year,
            month,
            0
        ).getDate();


    const totalCells =
        Math.ceil(
            (startDay + daysInMonth) / 7
        ) * 7;


    for (
        let cell = 0;
        cell < totalCells;
        cell++
    ) {

        let dayNumber;

        let cellDate;

        let otherMonth = false;


        if (cell < startDay) {

            dayNumber =
                previousMonthLastDay -
                startDay +
                cell +
                1;


            cellDate =
                new Date(
                    year,
                    month - 1,
                    dayNumber
                );


            otherMonth = true;

        } else if (
            cell >=
            startDay + daysInMonth
        ) {

            dayNumber =
                cell -
                startDay -
                daysInMonth +
                1;


            cellDate =
                new Date(
                    year,
                    month + 1,
                    dayNumber
                );


            otherMonth = true;

        } else {

            dayNumber =
                cell -
                startDay +
                1;


            cellDate =
                new Date(
                    year,
                    month,
                    dayNumber
                );

        }


        const dateString =
            getLocalDateString(
                cellDate
            );


        const tasks =
            dashboardData.tasks.filter(
                task =>
                    task.dueDate ===
                    dateString
            );


        const isToday =
            dateString ===
            getLocalDateString();


        const isSelected =
            dateString ===
            selectedDate;


        const dayElement =
            document.createElement("div");


        dayElement.className =
            "calendar-day";


        if (otherMonth) {

            dayElement.classList.add(
                "other-month"
            );

        }


        if (isToday) {

            dayElement.classList.add(
                "today"
            );

        }


        if (isSelected) {

            dayElement.classList.add(
                "selected"
            );

        }


        const eventPreview =
            tasks
                .slice(0, 2)
                .map(
                    task => `
                        <div class="calendar-event-dot">
                            ${escapeHTML(task.title)}
                        </div>
                    `
                )
                .join("");


        dayElement.innerHTML = `

            <div class="calendar-day-number">
                ${dayNumber}
            </div>

            <div class="calendar-events">
                ${eventPreview}
            </div>

            ${
                tasks.length > 2
                    ? `
                        <div class="calendar-count">
                            +${tasks.length - 2}
                        </div>
                    `
                    : ""
            }

        `;


        dayElement.addEventListener(
            "click",
            () => {

                selectedDate =
                    dateString;

                renderCalendar();

                renderSelectedDay();

            }
        );


        grid.appendChild(
            dayElement
        );

    }


    renderSelectedDay();

}


function changeMonth(amount) {

    currentCalendarDate.setMonth(
        currentCalendarDate.getMonth() +
        amount
    );


    renderCalendar();

}


function goToToday() {

    const today =
        new Date();


    currentCalendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    selectedDate =
        getLocalDateString();


    renderCalendar();

}


function renderSelectedDay() {

    const title =
        document.getElementById(
            "selectedDateTitle"
        );


    const container =
        document.getElementById(
            "selectedDayTasks"
        );


    const date =
        new Date(
            `${selectedDate}T00:00:00`
        );


    title.textContent =
        date.toLocaleDateString(
            "th-TH",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    const tasks =
        dashboardData.tasks
            .filter(
                task =>
                    task.dueDate ===
                    selectedDate
            )
            .sort(sortTasks);


    if (!tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                วันนี้ยังไม่มี Task
            </div>
        `;

        return;

    }


    container.innerHTML =
        tasks
            .map(
                task => `
                    <div
                        class="selected-task task-clickable"
                        data-task-id="${escapeHTML(task.id)}"
                        onclick="openTaskDetails(this)"
                    >

                        <div class="selected-task-title">
                            ${
                                task.completed
                                    ? "✓ "
                                    : "☐ "
                            }

                            ${escapeHTML(task.title)}
                        </div>

                        <div class="selected-task-meta">

                            ${
                                task.time
                                    ? `⏰ ${task.time}`
                                    : "ไม่มีเวลา"
                            }

                            ·

                            Priority:
                            ${task.priority}

                        </div>

                    </div>
                `
            )
            .join("");

}


// =========================================
// GOALS PAGE
// =========================================

function renderGoalsPage() {

    const container =
        document.getElementById(
            "allGoalsList"
        );


    if (!dashboardData.goals.length) {

        container.innerHTML = `
            <div class="card empty-state">
                ยังไม่มี Goal
            </div>
        `;

        return;

    }


    container.innerHTML =
        dashboardData.goals
            .map(
                goal => {

                    const progress =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    goal.progress
                                ) || 0
                            )
                        );


                    return `
                        <div class="goal-page-card">

                            <div class="goal-page-top">

                                <div class="goal-page-title">
                                    ${escapeHTML(goal.title)}
                                </div>

                                <div class="goal-page-percent">
                                    ${progress}%
                                </div>

                            </div>

                            <div class="progress-bar">

                                <div
                                    class="progress-fill"
                                    style="width: ${progress}%"
                                ></div>

                            </div>

                            <div class="goal-page-controls">

                                <button
                                    class="goal-control-button"
                                    onclick="changeGoalProgress('${goal.id}', -10)"
                                >
                                    −10
                                </button>

                                <button
                                    class="goal-control-button"
                                    onclick="changeGoalProgress('${goal.id}', 10)"
                                >
                                    +10
                                </button>

                                <button
                                    class="goal-control-button"
                                    onclick="deleteGoal('${goal.id}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


// =========================================
// TASKS PAGE
// =========================================

function renderTasksPage() {

    const container =
        document.getElementById(
            "allTasksList"
        );


    if (!container) return;


    const tasks =
        [...dashboardData.tasks]
            .sort((a, b) => {

                if (a.completed !== b.completed) {

                    return a.completed
                        ? 1
                        : -1;

                }


                return sortTasks(a, b);

            });


    if (!tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                ยังไม่มี Task
            </div>
        `;

        return;

    }


    container.innerHTML =
        tasks
            .map(
                task => `
                    <div
                        class="all-task-row task-clickable"
                        data-task-id="${escapeHTML(task.id)}"
                        onclick="openTaskDetails(this)"
                    >

                        <input
                            type="checkbox"
                            class="task-checkbox"
                            ${
                                task.completed
                                    ? "checked"
                                    : ""
                            }
                            onchange="toggleTask('${task.id}'); event.stopPropagation()"
                            onclick="event.stopPropagation()"
                        >

                        <div
                            class="all-task-title ${
                                task.completed
                                    ? "completed"
                                    : ""
                            }"
                        >
                            ${escapeHTML(task.title)}
                        </div>

                        <div class="all-task-date">
                            ${formatDate(task.dueDate)}
                            ${
                                task.time
                                    ? ` ${task.time}`
                                    : ""
                            }
                        </div>

                        <button
                            type="button"
                            class="delete-button"
                            data-task-id="${escapeHTML(task.id)}"
                            onclick="event.stopPropagation(); deleteTask(this)"
                        >
                            ×
                        </button>

                    </div>
                `
            )
            .join("");

}


// =========================================
// PROGRESS PAGE
// =========================================

function renderProgressPage() {

    const goalsContainer =
        document.getElementById(
            "progressGoals"
        );


    if (!goalsContainer) return;


    if (!dashboardData.goals.length) {

        goalsContainer.innerHTML = `
            <div class="empty-state">
                ยังไม่มี Goal
            </div>
        `;

    } else {

        goalsContainer.innerHTML =
            dashboardData.goals
                .map(
                    goal => {

                        const progress =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number(
                                        goal.progress
                                    ) || 0
                                )
                            );


                        return `
                            <div class="progress-goal-row">

                                <div class="progress-goal-header">

                                    <span>
                                        ${escapeHTML(goal.title)}
                                    </span>

                                    <span>
                                        ${progress}%
                                    </span>

                                </div>

                                <div class="progress-bar">

                                    <div
                                        class="progress-fill"
                                        style="width: ${progress}%"
                                    ></div>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    const today =
        getLocalDateString();


    const todayTasks =
        dashboardData.tasks.filter(
            task =>
                task.dueDate === today
        );


    const completed =
        todayTasks.filter(
            task =>
                task.completed
        ).length;


    const percentage =
        todayTasks.length
            ? Math.round(
                (completed /
                    todayTasks.length) *
                    100
            )
            : 0;


    const summary =
        document.getElementById(
            "progressTaskSummary"
        );


    if (summary) {

        summary.innerHTML = `

            <div class="progress-big-number">
                ${percentage}%
            </div>

            <div class="progress-small-text">
                ${completed} / ${todayTasks.length}
                tasks completed today
            </div>

        `;

    }


    renderTaskPieChart(
        todayTasks
    );


    renderTaskBarChart();

}


function renderTaskPieChart(tasks) {

    const chart =
        document.getElementById(
            "taskPieChart"
        );

    const percentElement =
        document.getElementById(
            "taskPiePercent"
        );

    const legend =
        document.getElementById(
            "taskPieLegend"
        );


    if (!chart || !percentElement || !legend) {
        return;
    }


    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const remaining =
        Math.max(
            0,
            total - completed
        );


    const percentage =
        total
            ? Math.round(
                (completed / total) *
                    100
            )
            : 0;


    const completedDegrees =
        percentage * 3.6;


    chart.style.background =
        `conic-gradient(
            #fff 0deg,
            #fff ${completedDegrees}deg,
            #242424 ${completedDegrees}deg,
            #242424 360deg
        )`;


    percentElement.textContent =
        `${percentage}%`;


    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-dot"></span>
            <span>Completed</span>
            <span class="legend-value">
                ${completed}
            </span>
        </div>

        <div class="legend-item">
            <span class="legend-dot remaining"></span>
            <span>Remaining</span>
            <span class="legend-value">
                ${remaining}
            </span>
        </div>

        <div class="legend-item">
            <span>Total</span>
            <span class="legend-value">
                ${total}
            </span>
        </div>
    `;

}


function renderTaskBarChart() {

    const container =
        document.getElementById(
            "taskBarChart"
        );


    if (!container) {
        return;
    }


    const today =
        new Date();


    const days = [];


    for (
        let offset = 6;
        offset >= 0;
        offset--
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() - offset
        );


        const dateString =
            getLocalDateString(date);


        const tasks =
            dashboardData.tasks.filter(
                task =>
                    task.dueDate ===
                    dateString
            );


        const completed =
            tasks.filter(
                task =>
                    task.completed
            ).length;


        days.push({
            date: dateString,
            total: tasks.length,
            completed
        });

    }


    const maxValue =
        Math.max(
            1,
            ...days.map(
                day => day.total
            )
        );


    container.innerHTML =
        days
            .map(
                day => {

                    const height =
                        day.total
                            ? Math.max(
                                4,
                                (
                                    day.total /
                                    maxValue
                                ) * 100
                            )
                            : 2;


                    const date =
                        new Date(
                            `${day.date}T00:00:00`
                        );


                    const label =
                        date.toLocaleDateString(
                            "en-US",
                            {
                                weekday: "short"
                            }
                        ).slice(0, 3);


                    return `
                        <div class="bar-column">

                            <div class="bar-value">
                                ${day.completed}/${day.total}
                            </div>

                            <div class="bar-track">

                                <div
                                    class="bar-fill"
                                    style="height: ${height}%"
                                    title="${day.completed} completed / ${day.total} tasks"
                                ></div>

                            </div>

                            <div class="bar-label">
                                ${label}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


// =========================================
// REFRESH EVERYTHING
// =========================================

function refreshEverything() {

    updateHeader();

    renderDashboard();

    renderCalendar();

    renderGoalsPage();

    renderTasksPage();

    renderProgressPage();

}


// =========================================
// SORT TASKS
// =========================================

function sortTasks(a, b) {

    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };


    if (
        priorityOrder[a.priority] !==
        priorityOrder[b.priority]
    ) {

        return (
            priorityOrder[a.priority] -
            priorityOrder[b.priority]
        );

    }


    return (
        (a.time || "99:99")
            .localeCompare(
                b.time || "99:99"
            )
    );

}


// =========================================
// CALCULATE GOAL PROGRESS
// =========================================

function calculateOverallGoalProgress() {

    if (!dashboardData.goals.length) {

        return 0;

    }


    const validGoals =
        dashboardData.goals.filter(
            goal =>
                goal &&
                typeof goal === "object"
        );


    if (!validGoals.length) {
        return 0;
    }


    const total =
        validGoals.reduce(
            (
                sum,
                goal
            ) =>
                sum +
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            goal.progress
                        ) || 0
                    )
                ),
            0
        );


    return Math.round(
        total /
        validGoals.length
    );

}


// =========================================
// DATE FORMAT
// =========================================

function formatDate(dateString) {

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "th-TH",
        {
            day: "numeric",
            month: "short"
        }
    );

}


// =========================================
// EXPORT / IMPORT
// =========================================

function backupData() {

    exportData(
        dashboardData
    );

}


function restoreData(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const confirmed =
        confirm(
            "Import ข้อมูลจะเขียนทับข้อมูลปัจจุบัน ต้องการดำเนินการต่อหรือไม่?"
        );


    if (!confirmed) {

        event.target.value = "";

        return;

    }


    importData(
        file,
        importedData => {

            dashboardData =
                normalizeDashboardData(
                    importedData
                );


            refreshEverything();


            alert(
                "Import ข้อมูลสำเร็จ"
            );

        }
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}