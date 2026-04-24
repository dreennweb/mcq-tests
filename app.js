// MCQ Quiz Application - Supports Multiple Tests from JSON files
// All tests are loaded from the /tests/ directory

class QuizManager {
  constructor() {
    this.availableTests = [];
    this.currentTestData = null;
    this.currentEngine = null;
    this.currentTestId = null;
    
    // DOM Elements
    this.testSelectorScreen = document.getElementById('testSelectorScreen');
    this.quizMainScreen = document.getElementById('quizMainScreen');
    this.scoreScreen = document.getElementById('scoreScreen');
    this.testListContainer = document.getElementById('testListContainer');
    this.quizTitle = document.getElementById('quizTitle');
    this.liveScoreDisplay = document.getElementById('liveScoreDisplay');
    this.progressFill = document.getElementById('progressFill');
    this.questionText = document.getElementById('questionText');
    this.optionsContainer = document.getElementById('optionsContainer');
    this.feedbackMessageDiv = document.getElementById('feedbackMessage');
    this.nextBtn = document.getElementById('nextBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.backToTestsBtn = document.getElementById('backToTestsBtn');
    this.retakeSameTestBtn = document.getElementById('retakeSameTestBtn');
    this.finalScoreSpan = document.getElementById('finalScoreSpan');
    this.scoreMessage = document.getElementById('scoreMessage');
    
    this.init();
  }
  
  async init() {
    this.attachEventListeners();
    await this.loadAvailableTests();
    this.showTestSelector();
  }
  
  attachEventListeners() {
    this.nextBtn.addEventListener('click', () => this.nextQuestion());
    this.restartBtn.addEventListener('click', () => this.restartCurrentTest());
    this.backToTestsBtn.addEventListener('click', () => this.backToTestSelector());
    this.retakeSameTestBtn.addEventListener('click', () => this.restartCurrentTest());
  }
  
  async loadAvailableTests() {
    // Define the list of test files available in the /tests/ directory
    // In a real scenario, you might have an API endpoint, but for GitHub Pages,
    // we'll manually list the tests or use a manifest file.
    // For demonstration, we'll try to load from a static list of test IDs.
    const testManifest = [
      { id: 'bsts', name: 'BSTS Basics', description: 'Test your core BSTS knowledge', icon: '📘' },
      { id: 'bsts-rules-basics', name: 'BSTS Rules', description: 'Test your BSTS Rules 2018 knowledge', icon: '🌐' },
      { id: 'economics-basic.json', name: 'Economics Basics', description: 'Economics basics', icon: '📈' },
      { id: 'economics-advanced.json', name: 'Economics Advanced', description: 'Economics Advanced', icon: '🏛️' }
    ];
    
    this.testListContainer.innerHTML = '';
    
    for (const testInfo of testManifest) {
      try {
        // Try to load the test JSON to verify it exists
        const response = await fetch(`tests/${testInfo.id}.json`);
        if (response.ok) {
          const testData = await response.json();
          this.availableTests.push({
            ...testInfo,
            data: testData,
            questionCount: testData.questions?.length || 0
          });
        } else {
          console.warn(`Test ${testInfo.id} not found, skipping`);
        }
      } catch (error) {
        console.warn(`Failed to load test ${testInfo.id}:`, error);
      }
    }
    
    this.renderTestList();
  }
  
  renderTestList() {
    if (this.availableTests.length === 0) {
      this.testListContainer.innerHTML = '<div class="loading-spinner">No tests available. Please add JSON files to the /tests/ directory.</div>';
      return;
    }
    
    this.testListContainer.innerHTML = this.availableTests.map(test => `
      <div class="test-card" data-test-id="${test.id}">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${test.icon}</div>
        <h3>${test.name}</h3>
        <p>${test.description}</p>
        <div class="test-badge">📋 ${test.questionCount} questions</div>
      </div>
    `).join('');
    
    // Add click event listeners to test cards
    document.querySelectorAll('.test-card').forEach(card => {
      card.addEventListener('click', () => {
        const testId = card.dataset.testId;
        const selectedTest = this.availableTests.find(t => t.id === testId);
        if (selectedTest) {
          this.startTest(selectedTest);
        }
      });
    });
  }
  
  async startTest(testInfo) {
    this.currentTestId = testInfo.id;
    this.currentTestData = testInfo.data;
    
    // Initialize quiz engine
    this.currentEngine = new QuizEngine(this.currentTestData);
    this.currentEngine.loadTest(this.currentTestData);
    
    // Update UI
    this.quizTitle.textContent = testInfo.name;
    this.showQuizScreen();
    this.renderCurrentQuestion();
    this.updateProgressAndScore();
  }
  
  showQuizScreen() {
    this.testSelectorScreen.classList.add('hidden');
    this.scoreScreen.classList.add('hidden');
    this.quizMainScreen.classList.remove('hidden');
  }
  
  showTestSelector() {
    this.quizMainScreen.classList.add('hidden');
    this.scoreScreen.classList.add('hidden');
    this.testSelectorScreen.classList.remove('hidden');
  }
  
  showScoreScreen() {
    this.quizMainScreen.classList.add('hidden');
    this.testSelectorScreen.classList.add('hidden');
    this.scoreScreen.classList.remove('hidden');
    
    const score = this.currentEngine.computeScore();
    const total = this.currentEngine.totalQuestions;
    this.finalScoreSpan.textContent = `${score}/${total}`;
    
    const percentage = (score / total) * 100;
    if (percentage === 100) {
      this.scoreMessage.innerHTML = '<span class="perfect-msg">🎉 Perfect Score! Excellent work! 🎉</span>';
    } else if (percentage >= 70) {
      this.scoreMessage.textContent = `Great job! You scored ${percentage}% 👍`;
    } else if (percentage >= 50) {
      this.scoreMessage.textContent = `Good attempt! Review the topics and try again. 📚`;
    } else {
      this.scoreMessage.textContent = `Keep practicing! You'll improve with more practice. 💪`;
    }
  }
  
  renderCurrentQuestion() {
    if (!this.currentEngine || this.currentEngine.isQuizComplete()) {
      this.showScoreScreen();
      return;
    }
    
    const question = this.currentEngine.getCurrentQuestion();
    const currentIndex = this.currentEngine.currentIndex;
    const isAnswered = this.currentEngine.isCurrentAnswered();
    const userAnswer = this.currentEngine.getCurrentUserAnswer();
    
    this.questionText.textContent = `${currentIndex + 1}. ${question.text}`;
    
    // Render options
    this.optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    
    question.options.forEach((option, idx) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option-item';
      if (isAnswered) {
        optionDiv.classList.add('disabled-opt');
        if (idx === question.correct) {
          optionDiv.classList.add('correct-highlight');
        } else if (idx === userAnswer && userAnswer !== question.correct) {
          optionDiv.classList.add('wrong-highlight');
        }
      }
      
      optionDiv.innerHTML = `
        <span class="option-prefix">${letters[idx] || idx + 1}</span>
        <span>${option}</span>
      `;
      
      if (!isAnswered) {
        optionDiv.addEventListener('click', () => this.selectOption(idx));
      }
      
      this.optionsContainer.appendChild(optionDiv);
    });
    
    // Show feedback if answered
    if (isAnswered) {
      const isCorrect = userAnswer === question.correct;
      const correctAnswerText = question.options[question.correct];
      if (isCorrect) {
        this.feedbackMessageDiv.textContent = '✅ Correct! Great job!';
        this.feedbackMessageDiv.className = 'feedback-message feedback-success';
      } else {
        this.feedbackMessageDiv.textContent = `❌ Wrong! The correct answer is: "${correctAnswerText}".`;
        this.feedbackMessageDiv.className = 'feedback-message feedback-error';
      }
      this.nextBtn.disabled = false;
    } else {
      this.feedbackMessageDiv.textContent = 'Select an answer to check if it\'s correct →';
      this.feedbackMessageDiv.className = 'feedback-message';
      this.nextBtn.disabled = true;
    }
    
    this.updateProgressAndScore();
  }
  
  selectOption(selectedIdx) {
    if (this.currentEngine.answerLocked) return;
    
    const question = this.currentEngine.getCurrentQuestion();
    const isCorrect = (selectedIdx === question.correct);
    
    this.currentEngine.submitAnswer(selectedIdx);
    this.renderCurrentQuestion();
    this.updateProgressAndScore();
  }
  
  nextQuestion() {
    if (!this.currentEngine.answerLocked) return;
    
    if (this.currentEngine.goToNext()) {
      this.renderCurrentQuestion();
    } else {
      // Quiz completed
      this.showScoreScreen();
    }
    this.updateProgressAndScore();
  }
  
  restartCurrentTest() {
    if (this.currentTestData) {
      this.currentEngine = new QuizEngine(this.currentTestData);
      this.currentEngine.loadTest(this.currentTestData);
      this.showQuizScreen();
      this.renderCurrentQuestion();
      this.updateProgressAndScore();
    }
  }
  
  backToTestSelector() {
    this.currentTestData = null;
    this.currentEngine = null;
    this.showTestSelector();
  }
  
  updateProgressAndScore() {
    if (!this.currentEngine) return;
    
    const score = this.currentEngine.computeScore();
    const total = this.currentEngine.totalQuestions;
    const currentIndex = this.currentEngine.currentIndex;
    const answered = this.currentEngine.userAnswers.filter(a => a !== null).length;
    
    this.liveScoreDisplay.textContent = `Score: ${score}/${total}`;
    const progressPercent = (answered / total) * 100;
    this.progressFill.style.width = `${progressPercent}%`;
  }
}

class QuizEngine {
  constructor(testData) {
    this.testData = testData;
    this.questions = [];
    this.totalQuestions = 0;
    this.currentIndex = 0;
    this.userAnswers = [];
    this.answerLocked = false;
  }
  
  loadTest(testData) {
    this.questions = testData.questions;
    this.totalQuestions = this.questions.length;
    this.currentIndex = 0;
    this.userAnswers = new Array(this.totalQuestions).fill(null);
    this.answerLocked = false;
  }
  
  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }
  
  getCurrentUserAnswer() {
    return this.userAnswers[this.currentIndex];
  }
  
  isCurrentAnswered() {
    return this.userAnswers[this.currentIndex] !== null;
  }
  
  submitAnswer(selectedIdx) {
    if (this.answerLocked) return false;
    this.userAnswers[this.currentIndex] = selectedIdx;
    this.answerLocked = true;
    return (selectedIdx === this.getCurrentQuestion().correct);
  }
  
  goToNext() {
    if (!this.answerLocked) return false;
    if (this.currentIndex + 1 < this.totalQuestions) {
      this.currentIndex++;
      this.answerLocked = false;
      return true;
    }
    return false;
  }
  
  isQuizComplete() {
    return this.userAnswers.every(ans => ans !== null);
  }
  
  computeScore() {
    let score = 0;
    for (let i = 0; i < this.totalQuestions; i++) {
      const userAns = this.userAnswers[i];
      if (userAns !== null && userAns === this.questions[i].correct) {
        score++;
      }
    }
    return score;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.quizApp = new QuizManager();
});
