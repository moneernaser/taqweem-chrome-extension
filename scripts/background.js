// 'use strict';


// chrome.runtime.onInstalled.addListener(details => {
//   console.log('previousVersion', details.previousVersion);
// });

// chrome.browserAction.setBadgeText({text: '\'Allo'});

// console.log('\'Allo \'Allo! Event Page for Browser Action');


// "use strict";

// var ITEM_PAGE_MAX_LENGTH = 40;
// var WIKI_SEEDS_STORE = 'https://wikiseeds.herokuapp.com/api/wikiseeds';
// var ARABIC_WIKIPEDIA_API = 'https://ar.wikipedia.org/w/api.php';
// var ENGLISH_WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// function searchInWikipedia(item) {
//   var wikipediaAPI = ENGLISH_WIKIPEDIA_API;
//   var arabicWordRegex = /[\u0600-\u06FF]/;
//   if (arabicWordRegex.test(item)) {
//     wikipediaAPI = ARABIC_WIKIPEDIA_API;
//   }
//   console.log('looking up "' + item + '" in ' + wikipediaAPI + ' ...');
//   return $.get(wikipediaAPI,
//     {
//       action: 'query',
//       prop: 'revisions',
//       format: 'json',
//       titles: item
//     });
// }

// function isItemMissing(data) {
//   return (data.query.pages["-1"]);
// }

// // Update badge on every new article suggest
// chrome.storage.onChanged.addListener(function (changes) {
//   chrome.browserAction.setBadgeText({ "text": changes.total.newValue.toString() });
// });

// //install menuItem
// chrome.runtime.onInstalled.addListener(function() {
//   /* Add context menu and listener */
//   var menuItem = {
//     id: "wikiSuggest",
//     title: "wiki-seed it",
//     contexts: ["selection"]
//   };
//   chrome.contextMenus.create(menuItem);
// });

// function getUserName() {
//   var d = $.Deferred();
//   chrome.storage.sync.get('username', function (items) {
//     var username = items.username || 'Unknown';
//     d.resolve(username);
//   });
//   return d;
// }

// function addToWikiStore(clickData, callback) {
//   getUserName().pipe(function (username) {
//     $.post(WIKI_SEEDS_STORE, {
//       name: clickData.selectionText,
//       sender: username,
//       urlfrom: clickData.pageUrl
//     }).done(callback).fail(function (xhr, status, error) {
//       console.error('recieved: status: ' + status +", message: "+ error);
//     });
//   });
// }

// function getSeedsCount() {
//   var d = $.Deferred();
//   chrome.storage.sync.get('total', function (items) {
//     d.resolve(items.total || 0);
//   });
//   return d;
// }

// function saveToWikiStoreCallback(data) {
//   console.log('recieved: ' + JSON.stringify(data));
//   getSeedsCount().pipe(function (seedCount) {
//     chrome.storage.sync.set({ 'total': seedCount + 1 });
//   });
// }

// chrome.contextMenus.onClicked.addListener(function (clickData) {
//   console.log(JSON.stringify(clickData));
//   if (clickData.menuItemId == "wikiSuggest" && clickData.selectionText
//     && clickData.selectionText.trim().length <= ITEM_PAGE_MAX_LENGTH) {

//     var suggestedItem = clickData.selectionText.trim();
//     searchInWikipedia(suggestedItem).done(function (data) {
//       if (isItemMissing(data)) {
//         console.log("Good! " + suggestedItem + " was not there.");
//         // add to wiki store:
//         addToWikiStore(clickData, saveToWikiStoreCallback)
//       } else {
//         console.log("Bad! " + suggestedItem + " already exists.")
//       }
//     });
//   }
// });
"use strict";