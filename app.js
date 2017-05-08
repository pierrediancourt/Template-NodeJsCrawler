"use strict";

/////Includes
const Q = require("q");
const Nightmare = require("nightmare");
Nightmare.Promise = Q.Promise;
/////

const nightmare = new Nightmare();

function getItemsListPageNumber(){
	const url = "https://www.google.fr/search?q=plop";
	console.log("Visiting url : "+url);
	return nightmare
        .goto(url)
        .wait()
        .inject("js", "node_modules/jquery/dist/jquery.js")
        .evaluate(function() { //the js we execute in the page opened in the electron browser
            //jquery available here because of the inject() line
        	//js executed on the client side
            return parseInt($("table#nav td:not(.navend):not(.cur)").last().text());
        })
        .end() //stops the navigation
}

function getItemsListsForPages(pageNumber){
	console.log("let's crawl pages from pageNumber 1 to "+pageNumber);
	const baseUrl = "https://www.google.com/search?q=plop&start=";
	var promises = [];
	for(var i=1; i<=pageNumber; i++){
		promises.push(getItemsListForPage(baseUrl+i+"0")); 	//https://www.google.com/search?q=plop&start=10
	}

	return Q.allSettled(promises)
		.then(function (results) {
		    console.log("allSettled results : "+JSON.stringify(results, null, 4));

		    var allResults = [];
		    results.forEach(function (result) {
		        if (result.state === "fulfilled") {
		        	console.log("allSettled one promise fulfilled");
		        	console.log("fulfilled promise data : "+JSON.stringify(result.value, null, 4));
		            allResults.push(result.value)
		        } else {
		        	console.log("allSettled one promise rejected");
		        	console.log("rejected promise data : "+JSON.stringify(result.value, null, 4));
		            console.log("allSettled error : "+result.reason);		            
		            throw new Error("Let's crash dirty, one promise among others rejected");
		        }
			});
			
			console.log("allSettled returning array of results from all crawled pages");
			return allResults;
		}).fail(function(error){
			console.log("allSettled error : "+error);
		});
}

function getItemsListForPage(url){
	console.log("crawling url : "+url);
	return nightmare
        .goto(url)
        .wait()
        .inject("js", "node_modules/jquery/dist/jquery.js")
        .evaluate(function() { //the js we execute in the page opened in the electron browser
            //jquery available here because of the inject() line
        	//js executed on the client side
        	var itemsList = [];
        	$("div.g").each(function() {
				var itemPageLink = $(this).find("h3 > a").attr("href");
				var itemTitle = $(this).find("h3 > a").text();

				var item = {
					itemPageLink: itemPageLink,
				 	itemTitle: itemTitle
				};
				itemsList.push(item);
			});
            return itemsList;
        })
        .end() //stops the navigation
        .then(function(results){
        	console.log("page crawled with success : "+url); 
        	console.log("extracted data : "+JSON.stringify(results, null, 4)); 
        	return results;
        }, function(error){
        	return error;
        })
}

function workingAsExpected(){

	//proof that the crawling of page number 1 is working
	//and that allSettled with only one promise to wait is working
    return getItemsListsForPages(1) //number of pages to crawl
		.then(function(results){
			console.log("getItemsListsForPages fullfilled with results : "+JSON.stringify(results, null, 4));
			return results;
		}, function(error){
			console.log("getItemsListsForPages rejected with error : "+error);
		});

	//proof that the crawling of the page number is working
	/*return getItemsListPageNumber()
		.then(function(result){
			console.log("pageNumber : "+result);
			return getPrintersListsForPages(1);			
		})
		.then(function(results){
			console.log("coucou2 "+results);
			return results;
		});*/

}

function notWorkingAsExpected(){

	//shows that allSettled with more than one promise to wait isn't working
    return getItemsListsForPages(2) //number of pages to crawl
		.then(function(results){
			console.log("getItemsListsForPages fullfilled with results : "+JSON.stringify(results, null, 4));
			return results;
		}, function(error){
			console.log("getItemsListsForPages rejected with error : "+error);
		});

	//this is the final objective, aka what i expect to make work :
	//should display the crawled content of all crawled pages in one array
	/*return getItemsListPageNumber()
		.then(function(result){
			console.log("getItemsListPageNumber fullfilled with result : "+result);
			return getItemsListsForPages(result) //result holds the pageNumber crawled
				.then(function(results){
					console.log("getItemsListsForPages fullfilled with results : "+results);
					return results;
				}, function(error){
					console.log("getItemsListsForPages rejected with error : "+error);
				});
		}, function(error){
			console.log("getItemsListPageNumber rejected with error : "+error);
		});*/

	//same final test but with a more compact syntax
	/*return getItemsListPageNumber()
	    .then(getItemsListsForPages);*/

}


Q.try(function(){

	//comment the workingBlock and execute the notWorkingBlock or vice versa

	///// WORKING BLOCK
	/*var workingAsExpectedPromise = workingAsExpected();
	console.log("workingAsExpected return : " +workingAsExpectedPromise);

	workingAsExpectedPromise
	.then(function(success){
		console.log("workingAsExpected main success : "+JSON.stringify(success, null, 4)); //return an array containing the results from all the crawled pages
	}, function(error){
		console.log("workingAsExpected main error : "+error);
	}).done();*/

	///// NOT WORKING BLOCK
	var notWorkingAsExpectedPromise = notWorkingAsExpected();
	console.log("notWorkingAsExpected return : " +notWorkingAsExpectedPromise);

	notWorkingAsExpectedPromise
	.then(function(success){
		console.log("notWorkingAsExpected main success : "+JSON.stringify(success, null, 4));
	}, function(error){
		console.log("notWorkingAsExpected main error : "+error);
	}).done();

}).catch(function(e){
	console.log("catch error : "+e);
})