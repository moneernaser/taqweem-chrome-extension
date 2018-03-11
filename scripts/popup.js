'use strict';

var $ = jQuery;

var ADHAN_API_example = "http://api.aladhan.com/v1/calendar?latitude=51.508515&longitude=-0.1254872&method=2&month=4&year=2017";
var ADHAN_API = "http://api.aladhan.com/v1/calendar?latitude={0}&longitude={1}&method=2&month={2}&year={3}";

function get_api_url(latitude, longitude, month, year) {
  //return ADHAN_API.format(latitude, longitude, month, year);
  return ADHAN_API_example;
}

function getData() {
  var location = getGeoLocation();
  var month = new Date().getMonth() + 1;
  var year = new Date().getFullYear();
  var api_url = get_api_url(location.latitude, location.longitude, month, year);
  $.get(api_url, function (data) {
    console.log("data:");
    console.log(data);
  });
}

getData();

// chrome.storage.sync.get('total', function (items) {
//   $('#seedCount').text(items.total || 0);
// });

//if username does not exist, show username input
// chrome.storage.sync.get('username', function (items) {
//   if (!items.username) {
//     $('.username-input').css('display', 'block');
//   } else {
//     $('.username').text(items.username);
//     $('.greeting').css('display', 'block');
//   }
// });

//save username entered
// $('.username-input').keypress(function (e) {
//   var key = e.which;
//   if(key == 13)  // the enter key code
//   {
//     var username = $('input[name = username_input_field]').val();
//     console.log(username);
//     if (username && (username.trim().length > 0)){
//       chrome.storage.sync.set({ 'username': username });
//       $('.username-input').css('display', 'none');
//       $('.username').text(username);
//       $('.greeting').css('display', 'block');
//     }
//   }
// });

// show username input when clicking on username
// $('.username').click(function (event) {
//   $('.username-input').css('display', 'block');
//   $('.greeting').css('display', 'none');
// });

// function OpenShortcut(location)
// {
//   chrome.tabs.create({ url: location, active: false });
// }


// go to website and facebook page
// document.addEventListener('DOMContentLoaded', function () {
//   document.getElementById('wikiseeds_facebook_url').addEventListener('click', function() {
//     OpenShortcut('https://www.facebook.com/groups/1529232844070480/');
//   });
//   document.getElementById('leaderboard_url').addEventListener('click', function() {
//     OpenShortcut('https://wikiseeds.herokuapp.com/#/tab/leaderboard');
//   });
//   document.getElementById('seeds_url').addEventListener('click', function() {
//     OpenShortcut('https://wikiseeds.herokuapp.com/#/tab/seeds');
//   });
// });