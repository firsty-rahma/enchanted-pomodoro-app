import { storeItem, storeData, getLatestData } from "/storage.js";

export class Timer {
    constructor() {
        this.timer = {
            id: "",
            date: "",
            task_name: "",
            pomodoro: 0,
            shortbreak: 0,
            longbreak: 0,
            longbreakInterval: 0,
            sessions: 0
        };
        this.interval = null;

        this.addPopupBtn = document.getElementById('add-popup-btn');
        this.addPopupOverlay = document.getElementById('add-popup-overlay');
        this.closePopupBtn = document.getElementById('close-popup-button');
        
        this.saveBtn = document.getElementById('save-button');
        this.pomoInput = document.getElementById('pomodoro-input');
        this.shortbrInput = document.getElementById('shortbreak-input');
        this.longbrInput = document.getElementById('longbreak-input');
        this.longbrIntInput = document.getElementById('longbreakInterval-input');

        this.tasksList = document.getElementById('task-list');

        this.taskInput = document.getElementById('task-input');
        this.mainBtn = document.getElementById('clock-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.buttonSound = new Audio('/sound/button.mp3');
        this.modeButtons = document.getElementById('mode-buttons');

        this.init();
    }

    init(){
        window.addEventListener('load', this.loadLatestTasks());

        this.mainBtn.addEventListener('click', () => {
            this.buttonSound.play();
            const {action} = this.mainBtn.dataset;
            if (action == 'start') {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        });

        this.modeButtons.addEventListener('click', (event)=> {
            const {mode} = event.target.dataset;
            
            if (!mode) return;
            this.switchMode(mode);
            this.stopTimer();
        });

        this.addPopupBtn.addEventListener('click', () => {
            this.addPopupOverlay.classList.toggle('show');
        });

        this.saveBtn.addEventListener('click', () => {
            if (this.taskInput.value == '' || this.taskInput.value == null) {
                alert("Please add the task");
            } else {
                this.saveTasks();
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.switchMode('pomodoro');
        });

        this.resetBtn.addEventListener('click', () => {
            const curTask = document.querySelector('.current-task');
            curTask.textContent = '';

            this.timer.pomodoro = 0;
            this.timer.shortbreak= 0;
            this.timer.longbreak = 0;
            this.timer.longbreakInterval = 0;
            this.switchMode('pomodoro');
        });

        this.closePopupBtn.addEventListener('click', () => {
            this.addPopupOverlay.classList.toggle('show');
        });
    }

    saveTasks() {
        let latestTasks = getLatestData();
        
        const curTask = document.querySelector('.current-task');
        curTask.textContent = this.taskInput.value;

        this.timer.task_name = this.taskInput.value;
        this.timer.id = Math.floor(Math.random() * Date.now());
        this.timer.date = new Date();
        this.timer.pomodoro = this.pomoInput.valueAsNumber;
        this.timer.shortbreak= this.shortbrInput.valueAsNumber;
        this.timer.longbreak = this.longbrInput.valueAsNumber;
        this.timer.longbreakInterval = this.longbrIntInput.valueAsNumber;

        storeItem(this.timer);
        latestTasks.push(this.timer);

        this.renderTask(this.timer);

        storeData(latestTasks);
        this.addPopupOverlay.classList.toggle('show');
        this.switchMode('pomodoro');
    }

    loadLatestTasks() {
        const latestTasks = getLatestData();
        if (latestTasks) {
            for (const task in latestTasks) {
            this.renderTask(latestTasks[task]);
            }
        } else {
            console.log("No data");
        }

    }

    renderTask(task){
        const taskItem = document.createElement("li");
        taskItem.classList.add('task-item');

        const taskLabel = document.createElement("div");
        const nameLabel = document.createElement("span");
        nameLabel.innerHTML = task.task_name;
        nameLabel.classList.add('task-name-label');

        const focusLabel = document.createElement("span");
        focusLabel.innerHTML = `${task.pomodoro} minutes`;
        focusLabel.classList.add('task-focus-label');

        taskLabel.appendChild(nameLabel);
        taskLabel.appendChild(focusLabel);
        taskItem.appendChild(taskLabel);
        this.tasksList.appendChild(taskItem);
    }

    getRemainingTime(endTime) {
        const currentTime = Date.parse(new Date());
        const difference = endTime - currentTime;
    
        const total = Number.parseInt(difference / 1000, 10);
        const minutes = Number.parseInt((total / 60) % 60, 10);
        const seconds = Number.parseInt(total % 60, 10);
        
        return {
            total, minutes, seconds
        };
    }
    
    switchMode(mode) {
        this.timer.mode = mode;
        this.timer.remainingTime = {
            total: this.timer[mode] * 60,
            minutes: this.timer[mode],
            seconds: 0,
        };
    
        document.querySelectorAll('button[data-mode]')
        .forEach(e => e.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"`).classList.add('active');
    
        this.updateClock();
    }
    
    updateClock() {
        const {remainingTime} = this.timer;
        const minutes = `${remainingTime.minutes}`.padStart(2, '0');
        const seconds = `${remainingTime.seconds}`.padStart(2, '0');
    
        const min = document.getElementById('clock-minutes');
        const sec = document.getElementById('clock-seconds');
    
        min.textContent = minutes;
        sec.textContent = seconds;
    
        const text = this.timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
        document.title = `${minutes}:${seconds} — ${text}`;
    }
    
   startTimer() {
        let {total} = this.timer.remainingTime;
        const endTime = Date.parse(new Date()) + total * 1000;

        if(this.timer.mode === 'pomodoro') this.timer.sessions++;
        console.log(this.timer.sessions);

        this.mainBtn.dataset.action = 'stop';
        this.mainBtn.textContent = 'Stop';
        this.mainBtn.classList.add('active');

        this.resetBtn.disabled = true;
        this.addPopupBtn.disabled = true;
    
        this.interval = setInterval(() => {
            this.timer.remainingTime = this.getRemainingTime(endTime);
            this.updateClock();
    
            total = this.timer.remainingTime.total;
            if (total <= 0) {
                clearInterval(this.interval);
    
                switch (this.timer.mode) {
                    case 'pomodoro':
                        if (this.timer.sessions % this.timer.longbreakInterval === 0) {
                            this.switchMode('longbreak');
                        } else {
                            this.switchMode('shortbreak');
                        }
                        break;
                
                    default:
                        this.switchMode('pomodoro');
                }
                document.querySelector(`[data-sound="${this.timer.mode}"]`).play();
                this.startTimer();
            }
        }, 1000);
    }
    
    stopTimer() {
        clearInterval(this.interval);
    
        this.mainBtn.dataset.action = 'start';
        this.mainBtn.textContent = 'Start';
        this.mainBtn.classList.remove('active');

        this.resetBtn.disabled = false;
        this.addPopupBtn.disabled = false;
    }
}