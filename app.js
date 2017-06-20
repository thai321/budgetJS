
// BUDGET CONTROLLER
var budgetController = (function() {

	var Expenses = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expenses.prototype.calcPercentage = function(totalIncome) {
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expenses.prototype.getPercentage = function(){
		return this.percentage;
	};

	var Income = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	var calculateTotal = function(type) {
		var sum = 0;

		data.allItems[type].forEach(function(current) {
			sum += current.value; // current here is object of either Income or Expenses
		});											// each object has 3 types of values: type, description, value
		data.totals[type] = sum; // update to the data
	};

	var data = {
		
		allItems: {
			exp: [], // Expenses object
			inc: [] // Income object
		},

		totals: {
			exp: 0,
			inc: 0
		},

		budget: 0,
		percentage: -1
	};

	return {

		addItems: function (type, des, val){
			var newItem, ID; // ID should be = last ID + 1
			// [1,2,3,4,5], next ID = 6
			// [1,2,4,6,8], next ID = 9

			// Create new ID
			if (data.allItems[type].length > 0) {
				lastObjectIndex = data.allItems[type].length - 1;
				ID = data.allItems[type][lastObjectIndex].id + 1;
			} else {
				ID = 0;
			}

			// Create new item based on 'inc' or 'exp' type
			if(type === 'exp') {
				newItem = new Expenses(ID, des, val);
			} else if (type === 'inc'){
				newItem = new Income(ID, des, val);
			}
			
			// Push it into our data structure
			data.allItems[type].push(newItem);

			// Return the new element
			return newItem;
		},

		calculateBudget: function() {
			// calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');

			// Calculate the budget: income - expenses
			data.budget = data.totals.inc - data.totals.exp;

			if (data.totals.inc > 0) {
				// calculate the percentage of income that we spent
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
				// Expense = 100 and income = 300 -> percentage = (100/300) *100 = 33%
			} else {
				data.percentage = -1;
			}
		},

		calculatePercentages: function() {
			/*
			a = 20, b = 10, c = 40, income = 100
			a -> 20/100 = 20%, b -> 10/100 = 10%, c -> 40/100 = 10%
			*/
			data.allItems.exp.forEach( function(current) {
				current.calcPercentage(data.totals.inc);
			});

		},

		getPercentage: function() {
			var allPerc = data.allItems.exp.map(function(current){
				return current.getPercentage();
			});
			return allPerc;  // an array
		},

		getBudget: function() {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		},

		deleteItem: function(type, id) {
			// id = 6
			// ids = [1 2 4 6 8]
			// therefore, index = 3

			var ids, index;

			ids = data.allItems[type].map(function(current){
				return current.id;
			});
			index = ids.indexOf(id);

			if (index !== -1) {
				data.allItems[type].splice(index, 1) // remove only 1 element at the index
			}
		},

		testing: function() {
			console.log(data);
		}

	};


})(); 


// UI CONTROLLER
var UIController = (function(){

	var DOMstrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expensesContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expensesLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercLabel: '.item__percentage',
		dateLabel: '.budget__title--month'
	}

	var formatNumber = function(num, type) {
			/*
				+ or - before number
				exactly 2 decimal points
				comma separating the thousands
			*/

			num = Math.abs(num);
			num = num.toFixed(2); // 2310.4567 --> "2310.46", 2000 --> "2000.00"

			numSplit = num.split('.');

			int = numSplit[0]; // a string
			if(int.length > 3) {
				// int.substr(0,1) // start at 0 and read only 1 character
				int = int.substr(0, int.length - 3) + ',' +  int.substr(int.length - 3, 3);
			}

			dec = numSplit[1];
			sign = (type === 'exp') ? '-' : '+'

			return sign + int + '.' + dec;
		};

	// list function
	var nodeListForEach = function(list, callback) {
		for (var i = 0; i < list.length; i++) {
			callback(list[i],i);
		}
	};


	return {

		getInput: function(){ // get the an input of 3 values (type, description, and value)
			return {   	// store these 3 values as an object
				type: document.querySelector(DOMstrings.inputType).value, // will be either inc or exp
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value) // convert the string to a float number
			};
		},
		
		addListItem: function(obj, type) {
			var html, newHtml, element;

			// Create HTML string with placeholder text
			if(type === 'inc') {
				element = DOMstrings.incomeContainer;

				html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
			} else if (type === 'exp') {
				element = DOMstrings.expensesContainer;

				html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
			}

			// Replace the placeholder text with some actual data
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%description%', obj.description);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));


			// Insert the HTML into the Dom
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
		},

		clearFields: function(){
			var fields, fieldsArr; // return an list, not array, so we convert the list to array
			fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
			
			var fieldsArr = Array.prototype.slice.call(fields)

			fieldsArr.forEach( function(current, index, array) {
				current.value = '';
			});

			fieldsArr[0].focus(); // put the cursor back to the description input after enter a item
		},

		displayBudget: function(obj) {
			type = (obj.budget > 0)? 'inc' : 'exp'

			document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
			document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
			document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

			if(obj.percentage > 0) {
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '---';
			}
		},

		deleteListItem: function(selectorID) { // we want a entire id
			// remove up item, so we can remove the child
			var el = document.getElementById(selectorID)
			el.parentNode.removeChild(el)  
		},

		displayPercentages: function(percentages) {
			var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

											//list 		callback function
			nodeListForEach(fields, function(current, index){
				if (percentages[index] > 0) {
					current.textContent = percentages[index] + '%';
				} else {
					current.textContent = '---';
				}

			});

		},

		displayMonth: function(){
			var now, year, month;
			Date.prototype.getMonthName = function() {
			  var months = ['January', 'February', 'March', 'April', 'May', 'June', 
			  	'July', 'August', 'September', 'October', 'November', 'December'];
			  return months[this.getMonth()];
			};

			now = new Date();
			// var christmas = new Date(2016, 11, 25);

			year = now.getFullYear();
			month = now.getMonthName();

			document.querySelector(DOMstrings.dateLabel).textContent = month + ' ' + year;
		},

		changedType: function(){
			var fields = document.querySelectorAll(
				DOMstrings.inputType + ',' +
				DOMstrings.inputDescription + ',' +
				DOMstrings.inputValue
				);

			nodeListForEach(fields, function(current){
				current.classList.toggle('red-focus');
			});

			document.querySelector(DOMstrings.inputBtn).classList.toggle('red');

		},

		getDOMstrings: function() {
			return DOMstrings;
		}

	};

})();


// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl){

	var setupEventListeners = function(){ // all the event listeners are here

		var DOM = UICtrl.getDOMstrings();

		document.querySelector(DOM.inputBtn).addEventListener('click', ctrAddItem );


		document.addEventListener('keypress', function(event) {
			
			if(event.keyCode === 13 || event.which === 13) {
				ctrAddItem();
			}

		});

		document.querySelector(DOM.container).addEventListener('click',ctrlDeleteItem);

		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

	};

	var updateBudget = function() {
		// 1. Calculate the budget
		budgetCtrl.calculateBudget();

		// 2. Return the budget
		var budget = budgetCtrl.getBudget();

		// 3. Display the budget on the UI
		UICtrl.displayBudget(budget);
	};

	var updatePercentages = function() {
		// 1. Calculate percentages
		budgetCtrl.calculatePercentages();

		// 2. Read percentages from the budget controller
		var percentages = budgetCtrl.getPercentage(); // return an array of percentages
		// console.log(percentage);

		// 3. Update the UI with the new percentages
		UICtrl.displayPercentages(percentages);

	};

	var ctrAddItem = function(){
		var input, newItem;


		// 1. Get the filed input data
		input = UICtrl.getInput();

		if(input.description !== '' && !isNaN(input.value) && input.value > 0) {

			// 2. Add the item to the budget controller
			newItem = budgetCtrl.addItems(input.type, input.description, input.value);

			// 3. Add the item to the UI
			UICtrl.addListItem(newItem,input.type);

			// 4. Clear the fields
			UICtrl.clearFields();

			// 5. Calculate and update budget
			updateBudget();

			// 6. Calculate and update percentages
			updatePercentages();
		}
	};

	var ctrlDeleteItem = function(event) {
		var itemID, splitID, type, ID;
		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id ; // ex: income-2, or undefined
		// only work, when we hit the button - , and it's gonna bubble up to income-# class
		if(itemID) {
			//inc-1
			splitID = itemID.split('-');
			type = splitID[0];
			ID = parseInt(splitID[1]);

			// 1. delete the item from the data structure
			budgetCtrl.deleteItem(type, ID);

			// 2. Delete the item from the UI
			UICtrl.deleteListItem(itemID);

			// 3. Update and show the new budget
			updateBudget()

			// 4. Calculate and update percentages
			updatePercentages();
		}
	};


	return {
		init: function() {
			console.log('Application has started.');
			UICtrl.displayMonth();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1
			});
			setupEventListeners();
		}
	}

})(budgetController, UIController);


controller.init();

