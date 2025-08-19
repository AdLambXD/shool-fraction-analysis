document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element & Global State ---
    const studentSelect = document.getElementById('student-select');
    const examSelect = document.getElementById('exam-select');
    const classSelect = document.getElementById('class-select');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    const trendFilters = document.getElementById('trend-filters');

    // Data Store
    let allExamsData = []; // Holds data for ALL exams after initial load
    let examList = [];     // Holds the list of exam metadata (name, id, file)

    // Chart instances
    let subjectChart, radarChart, trendChart;

    // --- 2. INITIAL DATA LOADING & PRE-PROCESSING ---
    async function loadAllData() {
        try {
            // Step 1: Fetch the exam index
            const indexResponse = await fetch('exams.json');
            if (!indexResponse.ok) throw new Error('Cannot load exams.json index');
            examList = await indexResponse.json();

            // Step 2: Create a list of fetch promises for each exam file
            const fetchPromises = examList.map(exam =>
                fetch(exam.file).then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${exam.file}`);
                    return res.json();
                })
            );

            // Step 3: Execute all fetches in parallel and store the results
            allExamsData = await Promise.all(fetchPromises);
            
            // Step 4: Sort exams by date, newest first, for display
            allExamsData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Step 5: Populate the first selector
            const examOptions = allExamsData.map(exam => ({ value: exam.id, label: exam.name }));
            populateSelector(examSelect, examOptions, "");
            resetSelector(classSelect, "", true);
            resetSelector(studentSelect, "", true);

        } catch (error) {
            console.error("Fatal Error during initial data load:", error);
            // Optionally, display an error message to the user on the page
        }
    }

    // --- 3. EVENT-DRIVEN UI LOGIC ---

    // Event 1: User selects an exam
    examSelect.addEventListener('change', () => {
        const examId = parseInt(examSelect.value);
        if (!examId) return;

        hideAllSections();
        resetSelector(studentSelect, "", true);

        const selectedExam = allExamsData.find(e => e.id === examId);
        const classOptions = selectedExam.classes.map(c => ({ value: c.id, label: c.name }));
        populateSelector(classSelect, classOptions, "");
        classSelect.disabled = false;
        componentHandler.upgradeAllRegistered();
    });

    // Event 2: User selects a class
    classSelect.addEventListener('change', () => {
        const examId = parseInt(examSelect.value);
        const classId = classSelect.value;
        if (!classId) return;

        hideAllSections();
        const selectedExam = allExamsData.find(e => e.id === examId);
        const selectedClass = selectedExam.classes.find(c => c.id === classId);
        const studentOptions = selectedClass.students.map(s => ({ value: s.id, label: s.name }));
        populateSelector(studentSelect, studentOptions, "");
        studentSelect.disabled = false;
        componentHandler.upgradeAllRegistered();
    });

    // Event 3: User selects a student -> Show all data
    studentSelect.addEventListener('change', () => {
        if (!studentSelect.value) {
            hideAllSections();
            return;
        }
        updateDashboard();
    });

    // --- 4. CORE RENDERING LOGIC ---
    function updateDashboard() {
        const examId = parseInt(examSelect.value);
        const studentId = studentSelect.value;
        const classId = classSelect.value;

        const exam = allExamsData.find(e => e.id === examId);
        const s_class = exam.classes.find(c => c.id === classId);
        const student = s_class.students.find(s => s.id === studentId);

        if (!student) return;

        // Show content sections
        ['summary-card-container', 'grades-container', 'trends-container', 'analysis-container'].forEach(id => {
            document.getElementById(id).style.display = '';
        });
        
        // This is the FIX for the trend buttons. MDL components must be re-initialized
        // after their container becomes visible.
        componentHandler.upgradeElements(trendFilters.querySelectorAll('.mdl-button'));

        // Calculate class averages on the fly
        const classAverages = calculateClassAverages(s_class);

        updateSummaryCard(student, s_class);
        updateGradesTable(student.subjects, classAverages);
        updateAnalysisCharts(student.subjects, classAverages);
        updateTrendChart(student.id);
    }
    
    // --- 5. CHARTING & DATA CALCULATION ---
    function updateAnalysisCharts(subjects, classAverages) {
        const labels = subjects.map(s => s.name);
        const myScores = subjects.map(s => s.score);
        const avgScores = subjects.map(s => classAverages[s.name] || 0);
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

        // Bar Chart
        if (subjectChart) subjectChart.destroy();
        subjectChart = new Chart(document.getElementById('subject-comparison-chart').getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: '我的成绩', data: myScores, backgroundColor: 'rgba(63, 81, 181, 0.8)' }, { label: '班级平均', data: avgScores, backgroundColor: 'rgba(255, 152, 0, 0.8)' }] },
            options: { scales: { y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { color: gridColor } } }, plugins: { legend: { labels: { color: textColor } } } }
        });
        
        // Radar Chart
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(document.getElementById('radar-chart').getContext('2d'), {
            type: 'radar',
            data: { labels, datasets: [{ label: '我的成绩', data: myScores, fill: true, backgroundColor: 'rgba(63, 81, 181, 0.2)', borderColor: 'rgb(63, 81, 181)', pointBackgroundColor: 'rgb(63, 81, 181)' }] },
            options: {
                scales: { r: { min: 0, max: 100, pointLabels: { color: textColor }, grid: { color: gridColor }, angleLines: { color: gridColor }, ticks: { color: textColor, backdropColor: 'transparent' } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    function updateTrendChart(studentId, filter = 'all') {
        const studentHistory = [];
        // Iterate through all loaded exams (already sorted by date)
        for (const exam of allExamsData) {
            let studentFound = null;
            // Find the student in any class within this exam
            for (const s_class of exam.classes) {
                studentFound = s_class.students.find(s => s.id === studentId);
                if (studentFound) break;
            }
            if (studentFound) {
                const avg = calculateAverage(studentFound.subjects, filter);
                const examname = exam.name.slice(0,4) + exam.name.slice(11,15);
                studentHistory.push({ name: examname, avg: avg });
            }
        }
        
        const labels = studentHistory.map(h => h.name);
        const data = studentHistory.map(h => h.avg);

        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

        if (trendChart) trendChart.destroy();
        trendChart = new Chart(document.getElementById('trend-chart').getContext('2d'), {
             type: 'line',
             data: { labels, datasets: [{ label: '平均分', data, borderColor: '#3f51b5', tension: 0.1, fill: false }] },
             options: { scales: { y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { color: gridColor } } }, plugins: { legend: { labels: { color: textColor } } } }
        });
    }

    // --- 6. HELPER & UTILITY FUNCTIONS ---
    
function updateSummaryCard(student, s_class) {
    document.getElementById('student-name').textContent = student.name;
    document.getElementById('student-class').textContent = s_class.name;
    
    const totalScore = student.subjects.reduce((sum, s) => sum + s.score, 0);
    document.getElementById('total-score').textContent = totalScore;
    const averageScore = (totalScore / student.subjects.length).toFixed(1);
    document.getElementById('average-score').textContent = averageScore;

    const minMax = getMinMaxSubjects(student.subjects);
    document.getElementById('max-subject').innerHTML = `${minMax.max.name} (${minMax.max.score})`;
    document.getElementById('min-subject').innerHTML = `${minMax.min.name} (${minMax.min.score})`;
    
    // Calculate real score trend based on historical data
    const studentId = student.id;
    const currentExamId = parseInt(examSelect.value);
    
    // Find the current exam index in allExamsData
    const currentExamIndex = allExamsData.findIndex(exam => exam.id === currentExamId);
    
    let previousTrend = 0;
    let classRank = 1;
    
    if (currentExamIndex < allExamsData.length - 1) {
        // Get the previous exam
        const previousExam = allExamsData[currentExamIndex + 1];
        
        // Find the student in the previous exam
        let previousStudent = null;
        for (const prevClass of previousExam.classes) {
            previousStudent = prevClass.students.find(s => s.id === studentId);
            if (previousStudent) break;
        }
        
        if (previousStudent) {
            // Calculate previous average
            const previousTotalScore = previousStudent.subjects.reduce((sum, s) => sum + s.score, 0);
            const previousAverageScore = previousTotalScore / previousStudent.subjects.length;
            
            // Calculate trend
            previousTrend = (averageScore - previousAverageScore).toFixed(1);
        }
    }
    
    // Calculate class rank
    const studentAverages = s_class.students.map(s => {
        const total = s.subjects.reduce((sum, subj) => sum + subj.score, 0);
        return {
            id: s.id,
            name: s.name,
            average: total / s.subjects.length
        };
    });
    
    // Sort by average score (descending)
    studentAverages.sort((a, b) => b.average - a.average);
    
    // Find current student's rank
    classRank = studentAverages.findIndex(s => s.id === studentId) + 1;
    if (classRank === 0) classRank = 1; // Default to 1 if not found
    
    // Update UI with real data
    const trendElement = document.getElementById('score-trend');
    const trendIcon = document.getElementById('trend-icon');
    
    trendElement.textContent = previousTrend > 0 ? `+${previousTrend}` : previousTrend;
    if (previousTrend > 0) {
        trendIcon.textContent = 'trending_up';
        trendIcon.style.color = '#4CAF50';
        trendElement.style.color = '#4CAF50';
    } else if (previousTrend < 0) {
        trendIcon.textContent = 'trending_down';
        trendIcon.style.color = '#F44336';
        trendElement.style.color = '#F44336';
    } else {
        trendIcon.textContent = 'trending_flat';
        trendIcon.style.color = '#3f51b5';
        trendElement.style.color = '#3f51b5';
    }
    
    // Update class rank
    document.getElementById('class-rank').textContent = `${classRank}/${s_class.students.length}`;
}
    function calculateClassAverages(s_class) {
        const subjectTotals = {};
        const subjectCounts = {};
        for (const student of s_class.students) {
            for (const subject of student.subjects) {
                subjectTotals[subject.name] = (subjectTotals[subject.name] || 0) + subject.score;
                subjectCounts[subject.name] = (subjectCounts[subject.name] || 0) + 1;
            }
        }
        const averages = {};
        for (const subjectName in subjectTotals) {
            averages[subjectName] = (subjectTotals[subjectName] / subjectCounts[subjectName]).toFixed(1);
        }
        return averages;
    }

    function getSubjectType(subjectName) {
        if (['语文', '数学', '英语'].some(s => subjectName.includes(s))) return 'main';
        if (['数学', '物理', '化学'].some(s => subjectName.includes(s))) return 'science';
        if (['语文', '历史', '政治'].some(s => subjectName.includes(s))) return 'liberal';
        return 'other';
    }

    function calculateAverage(subjects, filter) {
        const filteredSubjects = subjects.filter(subject => {
            if (filter === 'all') return true;
            return getSubjectType(subject.name) === filter;
        });
        if (filteredSubjects.length === 0) return 0;
        const total = filteredSubjects.reduce((sum, s) => sum + s.score, 0);
        return (total / filteredSubjects.length).toFixed(1);
    }
    
    // ... Other helpers ...
    function populateSelector(selector, options, placeholder) {
        selector.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            selector.appendChild(option);
        });
    }
    function resetSelector(selector, text, disabled = true) {
        selector.innerHTML = `<option value="" disabled selected>${text}</option>`;
        selector.disabled = disabled;
    }
    function hideAllSections() {
        ['summary-card-container', 'grades-container', 'trends-container', 'analysis-container'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
    }
    function getMinMaxSubjects(subjects) {
        const max = [...subjects].sort((a, b) => b.score - a.score)[0];
        const min = [...subjects].sort((a, b) => a.score - b.score)[0];
        return { max, min };
    }
    function getScoreClass(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score < 60) return 'score-fail';
        return 'score-pass';
    }
    function getGradeLevel(score) {
        if (score >= 90) return '优秀'; if (score >= 80) return '良好'; if (score >= 60) return '及格'; return '不及格';
    }

    function updateGradesTable(subjects, classAverages) {
        const tableBody = document.getElementById('grades-table-body');
        tableBody.innerHTML = '';
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="mdl-data-table__cell--non-numeric">${subject.name}</td>
                <td class="score-cell ${getScoreClass(subject.score)}">${subject.score}</td>
                <td>${getGradeLevel(subject.score)}</td>
                <td>${classAverages[subject.name] || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function downloadCSV() {
        const examId = parseInt(examSelect.value);
        const studentId = studentSelect.value;
        const classId = classSelect.value;

        const exam = allExamsData.find(e => e.id === examId);
        const s_class = exam.classes.find(c => c.id === classId);
        const student = s_class.students.find(s => s.id === studentId);
        const classAverages = calculateClassAverages(s_class);
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel
        csvContent += "科目,成绩,等级,班级平均\r\n";
        student.subjects.forEach(subject => {
            const row = [
                `"${subject.name}"`, // Enclose in quotes to handle commas
                subject.score,
                getGradeLevel(subject.score),
                classAverages[subject.name] || 'N/A'
            ].join(",");
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${student.name}_${exam.name}_成绩单.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- 7. GLOBAL EVENT LISTENERS ---
    trendFilters.addEventListener('click', (e) => {
        const button = e.target.closest('.trend-filter-btn');
        if (button) {
            document.querySelectorAll('.trend-filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateTrendChart(studentSelect.value, button.dataset.filter);
        }
    });
    
    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.getElementById('theme-icon').textContent = document.body.classList.contains('dark-mode') ? 'brightness_4' : 'brightness_7';
        if (studentSelect.value) {
            updateDashboard();
        }
    });

    downloadCsvBtn.addEventListener('click', downloadCSV);

    // --- KICKSTART THE APP ---
    loadAllData();
});