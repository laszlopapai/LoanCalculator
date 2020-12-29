var AnnuityLoan = function() {
	this.runMonth = 0;
	this.rate = 0.0;
	this.loan = 0;
	this.due = 0;
	this.startDate = new Date();
	this.startFee = 0;
	this.monthlyFee = 0;
	this.prePays = [];	
	this.interestChanges = [];
	
	this.tabledata = [];
	this.monthDetails = [];
	
	this.originalSummary = {
		months: 0,
		loss: 0,
		total: 0,
		prepay: 0,
		thm: 0,
		largestMonth: 0,
		plus: 0
		
	};
	this.changedSummary = {
		months: 0,
		loss: 0,
		total: 0,
		prepay: 0,
		aid: 0,
		pluspay: 0,
		thm: 0,
		largestMonth: 0,
		plus: 0
	};
	this.diffSummary = {
		months: 0,
		loss: 0,
		total: 0,
		prepay: 0,
		aid: 0,
		pluspay: 0,
		thm: 0,
		largestMonth: 0,
		plus: 0,
		saving: 0
	};
	
	this.addPrePay = function(prePay)
	{
		prePay = $.extend({
			monthIndex: 0,
			add: 0,
			aid: 0,
			rate: 0,
			cost: 0,
			newDue: 0,
			keepLength: true
		}, prePay);
		
		this.prePays.push(prePay);
	}
	
	this.addInterestChange = function(interestChange)
	{
		interestChange = $.extend({
			monthIndex: 0,
			rate: 0,
			keepLength: true
		}, interestChange);
		
		this.interestChanges.push(interestChange);
	}
	
	this.clean = function()
	{
		this.prePays = [];
		this.interestChanges = [];
	}
	
	this.addMonthDetail = function(month, details)
	{
		while (this.monthDetails.length <= month)
		{
			this.monthDetails.push({
				originalRemain: 0,
				originalLoss: 0,
				remain: 0,
				loss: 0,
			});
		}
		this.monthDetails[month] = $.extend(this.monthDetails[month], details);
	}
	
	
	this.calc = function()
	{
		var changedRunMonth = this.runMonth;
		var payed = 0;
		var rate = this.rate;
		var remain = this.loan;
		var startLoan = this.loan;
		var due = this.due;
	
		
	
		//// Default setup
		this.tabledata = [];
		this.diagramdata = [];
		
		var i, j, prev, kamattorl, toketorl, loss = 0, lloss, min, totalAid = 0, pluspay = 0;
		tableinstance.clear();
		var elotorl = new Array();
		var interestList = new Array();
		var temp = new Array();
		var otherLoss 		= this.startFee;
		var otherLossTotal 	= this.startFee;
		var max_months_pay = 0;
		
		// read pre-pays
		for(j = 0; j < this.prePays.length; j++) {
			var month = this.prePays[j].monthIndex;
			var add = this.prePays[j].add;
			var aid = this.prePays[j].aid;
			var addfull = this.prePays[j].add;
			var costRate = this.prePays[j].rate;
			var cost = this.prePays[j].cost;
			var newdue = Math.abs(this.prePays[j].newDue);

			if(!this.prePays[j].keepLength)
				add -= cost;
			add = add / (1.0 + costRate);
			if(this.prePays[j].keepLength) {
				lloss = Math.round(add * costRate);
				newdue = 0;
			}
			else {
				lloss = cost + Math.round(add * costRate);
			}
			if(month > 0 && add > 0){
				elotorl.push([month, add, lloss, this.prePays[j].keepLength, aid, addfull, newdue]);
			}
		}
		for(j = 0; j < this.interestChanges.length; j++) {
			var month = this.interestChanges[j].monthIndex;
			var newRate = this.interestChanges[j].rate;
			
			if(month > 0 && newRate > 0){
				interestList.push([month,newRate,this.interestChanges[j].keepLength]);
			}
		}

		
		///Generate without prepayment
		this.monthDetails = [];
		var woRemain = remain;
		var woLoss = 0;
		this.addMonthDetail(0, {
			originalRemain: woRemain,
			originalLoss: woLoss
		});
		for(woHonap = 1; woHonap <= this.runMonth && woRemain >= 0; woHonap++) {
			prev = woRemain;
			kamattorl = Math.round(woRemain * rate);
			toketorl = due - kamattorl;
			woRemain = Math.max(woRemain - toketorl, 0);
			woLoss = woLoss + kamattorl;
			otherLoss += this.monthlyFee;
			this.addMonthDetail(woHonap,{
				originalRemain: woRemain,
				originalLoss: woLoss
			});
		}
		
		var startFullPayable = woLoss + startLoan + otherLoss;
		//todo
		//var startThm = thmCalculator(startLoan, startFullPayable, woHonap - 1);
		this.originalSummary.months = woHonap - 1;
		this.originalSummary.loss = woLoss;
		this.originalSummary.total = startFullPayable;
		this.originalSummary.prepay = otherLoss;
		//this.originalSummary.thm = startThm;
		this.originalSummary.largestMonth = due + this.monthlyFee;
		this.originalSummary.plus = woLoss + otherLoss;
		
		
		
		///Generate data
		
		this.tabledata.push([0, '0', '0',Math.round(rate*1200 * 100)/100 , '0', '0', '0', convert2Money2(remain)]);
		this.addMonthDetail(0,{
			remain: remain,
			loss: loss
		});
		
		for(honap = 1; remain > 0 && honap <= 1000; honap++) {
			var date = new Date(this.startDate);
			date.setMonth(this.startDate.getMonth() + honap - 1);
			dateText = date.toLocaleDateString();
			honapText = '[' + dateText + '] ' + honap;
			
			for(j = 0; j < interestList.length; j++) {
				var month = interestList[j][0];

				if(honap == month) {
					var newRate = interestList[j][1];
					var mode = interestList[j][2];
					
					rate = newRate / 1200.0;
					
					if(mode){
						due = torlesztoszamitas(remain,rate,changedRunMonth);
					}
					else{
						changedRunMonth = futamidoszamitas(remain,rate,due,changedRunMonth);
					}
					this.tabledata.push([honapText, '', '',Math.round(rate*1200 * 100)/100, '', '', '', '']);
				}
			}
			for(j = 0; j < elotorl.length; j++) {
				var month = elotorl[j][0];
				
				if(honap == month) {
					var add = elotorl[j][1];
					var lloss = elotorl[j][2];
					var mode = elotorl[j][3];
					var aid = elotorl[j][4];
					var addfull = elotorl[j][5];
					var newdue = elotorl[j][6];
					
					pluspay += addfull - aid;
					totalAid += aid;
					//otherLossTotal += lloss;
					loss = loss + lloss;
					remain = remain - add;
					if (remain < 0){
						remain = 0;
					}
					payed += add;
					if(mode){
						due = torlesztoszamitas(remain,rate,changedRunMonth);
					}
					else{
						if (newdue != 0)
							due = newdue;
						changedRunMonth = futamidoszamitas(remain,rate,due,changedRunMonth);
					}
					this.tabledata.push([honapText, '', '', '' ,'', convert2Money2(add), '', '']);
				}
			}

			prev = remain;
			kamattorl = Math.round(remain * rate);
			toketorl = due - kamattorl;
			remain = remain - toketorl;
			loss = loss + kamattorl;
			otherLossTotal += this.monthlyFee;

			if(remain < 0) {
				remain = 0;
				toketorl = prev;
				due = toketorl + kamattorl;
			}
			payed += toketorl;
			if (max_months_pay < due)
				max_months_pay = due;

			this.tabledata.push([honapText, convert2Money2(prev), convert2Money2(due),Math.round(rate*1200 * 100)/100 , convert2Money2(kamattorl), convert2Money2(toketorl), convert2Money2(payed + loss), convert2Money2(remain)]);
			this.addMonthDetail(honap,{
				remain: remain,
				loss: loss
			});
			changedRunMonth--;
		}
		
		
		var newFullPayable = loss + startLoan + otherLossTotal;
		// todo
		//var newThm = thmCalculator(startLoan, newFullPayable, honap - 1);
		this.changedSummary.months = honap - 1;
		this.changedSummary.loss = loss;
		this.changedSummary.total = newFullPayable;
		this.changedSummary.prepay = otherLossTotal;
		this.changedSummary.aid = totalAid;
		this.changedSummary.pluspay = pluspay;
		//this.changedSummary.thm = newThm;
		this.changedSummary.largestMonth = max_months_pay + this.monthlyFee;
		this.changedSummary.plus = loss + otherLossTotal - totalAid;
		
		
		this.diffSummary.months = woHonap - honap;
		this.diffSummary.loss = woLoss-loss;
		this.diffSummary.total = startFullPayable - newFullPayable;
		this.diffSummary.prepay = otherLossTotal - otherLoss;
		this.diffSummary.aid = totalAid;
		this.diffSummary.pluspay = pluspay;
		//this.diffSummary.thm = startThm - newThm;
		this.diffSummary.largestMonth = this.due - max_months_pay;
		this.diffSummary.plus = (loss + otherLossTotal - totalAid) - (woLoss + otherLoss);
		this.diffSummary.saving = woLoss-loss - (+otherLossTotal - otherLoss) + totalAid;
	}
};
