
'use strict';

var $ = jQuery;

// show loading spinner when loading data from API
$(document).ajaxStart(function () {
  $("#loading-spinner").show();
}).ajaxStop(function () {
  $("#loading-spinner").hide();
});

$('.taq-goto-settings').click(function (event) {
  chrome.runtime.openOptionsPage(function () {});
});

var ADHAN_API = "http://api.aladhan.com/v1/calendar?latitude={0}&longitude={1}&method={2}&month={3}&year={4}";
var HIKMA_API = "https://hikam-api.herokuapp.com/hikma/random";

var ARABIC_MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
var ARABIC_ISLAMIC_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جُمادى الأولى", "جُمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
var ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
var ADANS = ["fajr", "sunrise", "duhr", "asr", "maghrib", "ishaa"];

/**
 * this function adds bidi characters around the string, so it can be displayed in order of concatentation
 * @param {*String} dir either "rtl" or "ltr"
 * @param {*String} str a string
 */
function wrap_dir(dir, str) {
  if (dir === 'rtl') return "\u202B" + str + "\u202C";
  return "\u202A" + str + "\u202C";
}

function format(str) {
  for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    params[_key - 1] = arguments[_key];
  }

  var args = params;
  return str.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
}

function get_api_url(latitude, longitude, method, month, year) {
  return format(ADHAN_API, latitude, longitude, method, month, year);
}

function getPosition() {
  return new Promise(function (res, rej) {
    navigator.geolocation.getCurrentPosition(res, rej);
  });
}

function fetchAdanData(api_url) {
  return $.get(api_url, function (data) {
    console.log("fetchAdanDate(): data fetched successfully");
  });
}

function daysDiff(d1, d2) {
  var timeDiff = Math.abs(d1.getTime() - d2.getTime());
  var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return diffDays;
}

function getHikma() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get('hikmaRecord', function (_ref) {
      var hikmaRecord = _ref.hikmaRecord;

      var hikma = undefined,
          hikmaReceivedAtDate = undefined;
      if (hikmaRecord) {
        var _ref2 = [hikmaRecord.hikma, hikmaRecord.hikmaReceivedAtDate];
        hikma = _ref2[0];
        hikmaReceivedAtDate = _ref2[1];
      }
      if (!hikmaReceivedAtDate || hikmaReceivedAtDate && new Date().getDate() != hikmaReceivedAtDate) {
        $.get(HIKMA_API, function (data) {
          var hikma = data[0].body;
          chrome.storage.sync.set({ hikmaRecord: { hikmaReceivedAtDate: new Date().getDate(), hikma: hikma } });
          resolve(hikma);
        });
      } else {
        resolve(hikma);
      }
    });
  });
}

function getMethod() {
  return new Promise(function (resolve) {
    chrome.storage.sync.get('adan_method', function (_ref3) {
      var adan_method = _ref3.adan_method;
      resolve(adan_method || 2);
    });
  });
}

async function getData() {
  var month = new Date().getMonth() + 1;
  var year = new Date().getFullYear();
  var method = await getMethod(),
      position = await getPosition();

  var api_url = get_api_url(position.coords.latitude, position.coords.longitude, method, month, year);
  var jsonData = await fetchAdanData(api_url),
      hikma = await getHikma();

  if (jsonData) {
    var daysData = jsonData.data;
    var currentDayData = daysData.find(function (element) {
      var date = element.date.gregorian;
      var day = parseInt(date.day);
      return day == new Date().getDate();
    });
    currentDayData.hikma = hikma;
    return currentDayData;
  }
}

function formatTime(timeString) {
  if (timeString.indexOf(" ") > 0) {
    return timeString.substring(0, timeString.indexOf(" "));
  }
  return timeString;
}

/**
 * returns the timeing of last prayer. 
 * @param dayData 
 * @returns one of the following: "fajr", "sunrise", "duhr", "asr", "magrib", "ishaa"
 */
function getCurrentAdan(dayData) {

  var nowHour = new Date().getHours();
  var nowMin = new Date().getMinutes();
  var AFTER_ISHAA = "23:99";
  var BEFORE_FAJR = "00:00";
  var formattedTimes = [dayData.timings.Fajr, dayData.timings.Sunrise, dayData.timings.Dhuhr, dayData.timings.Asr, dayData.timings.Maghrib, dayData.timings.Isha].map(function (x) {
    return formatTime(x);
  });
  var upcomingAdanIndex = 0;
  for (var i in formattedTimes) {
    var timeString = formattedTimes[i];
    var hour = timeString.substring(0, timeString.indexOf(":"));
    var min = timeString.substring(timeString.indexOf(":") + 1);
    if (nowHour > parseInt(hour) || parseInt(hour) == nowHour && nowMin > parseInt(min)) {
      // contine looping
      if (i == formattedTimes.length - 1) {
        return "ishaa";
      }
    } else {
      // if we are before fajr, return ishaa (of yesterday)
      if (i == 0) {
        return "ishaa";
      } else {
        return ["fajr", "sunrise", "duhr", "asr", "maghrib", "ishaa"][i - 1];
      }
    }
  }
}

function renderKnownValues() {
  var now = new Date();
  var islamicCal = kuwaiticalendar();
  // week day
  $(".taq-day span").text(ARABIC_DAYS[now.getDay()]);

  // miladi year
  $(".taq-year-miladi .taq-value").text(now.getFullYear());

  // hijri year
  $(".taq-year-hijri .taq-value").text(islamicCal[7]);

  // hijri day
  $(".taq-hijri-day span").text(parseInt(islamicCal[5]));

  // miladi day
  $(".taq-miladi-date .taq-miladi-day span").text(now.getDate());

  // hijri month name
  $(".taq-hijri-date .taq-month-name span").text(ARABIC_ISLAMIC_MONTHS[islamicCal[6]]);

  // miladi month name
  $(".taq-miladi-date .taq-month-name span").text(ARABIC_MONTHS[now.getMonth()]);
}

function getAdanLetter(adanName) {
  var letters = ["ف", "ش", "ظ", "ع", "م", "ع"];
  return letters[ADANS.indexOf(adanName)];
}

function getAdanAfter(adan, dayData) {
  var times = [dayData.timings.Fajr, dayData.timings.Sunrise, dayData.timings.Dhuhr, dayData.timings.Asr, dayData.timings.Maghrib, dayData.timings.Isha];
  return {
    name: ADANS[(ADANS.indexOf(adan) + 1) % 6],
    time: formatTime(times[(ADANS.indexOf(adan) + 1) % 6])
  };
}

function renderDataInHtml(dayData) {

  var now = new Date();
  // week day
  $(".taq-day span").text(ARABIC_DAYS[now.getDay()]);

  // miladi year
  $(".taq-year-miladi .taq-value").text(now.getFullYear());

  // hijri year
  $(".taq-year-hijri .taq-value").text(dayData.date.hijri.year);

  // hijri day
  $(".taq-hijri-day span").text(parseInt(dayData.date.hijri.day));

  // miladi day
  $(".taq-miladi-date .taq-miladi-day span").text(now.getDate());

  // hijri month name
  $(".taq-hijri-date .taq-month-name span").text(dayData.date.hijri.month.ar);

  // miladi month name
  $(".taq-miladi-date .taq-month-name span").text(ARABIC_MONTHS[now.getMonth()]);

  // fajr
  $(".taq-adan-fajr .taq-time span").text(formatTime(dayData.timings.Fajr));

  // sunrise
  $(".taq-adan-sunrise .taq-time span").text(formatTime(dayData.timings.Sunrise));

  // duhr
  $(".taq-adan-duhr .taq-time span").text(formatTime(dayData.timings.Dhuhr));

  // asr
  $(".taq-adan-asr .taq-time span").text(formatTime(dayData.timings.Asr));

  // maghrib
  $(".taq-adan-maghrib .taq-time span").text(formatTime(dayData.timings.Maghrib));

  // ishaa
  $(".taq-adan-ishaa .taq-time span").text(formatTime(dayData.timings.Isha));

  // select next adan
  var currentAdan = getCurrentAdan(dayData);
  $(".taq-adan-" + currentAdan).addClass("selected");

  var holidays = dayData.date.hijri.holidays;
  var message = dayData.hikma;
  var title = "حكمة اليوم";
  if (holidays && holidays.length > 0) {
    message = holidays[0];
    title = "في مثل هذا اليوم";
  }
  $(".taq-hikma-header span").text(title);
  $(".taq-hikma span").text(message);
}

function cacheData(dayData) {
  chrome.storage.sync.set({ 'currentDay': dayData });
}

function renderCachedData() {
  chrome.storage.sync.get('currentDay', function (_ref4) {
    var currentDay = _ref4.currentDay;

    if (currentDay) {
      renderDataInHtml(currentDay);
    }
  });
}

async function main() {
  renderKnownValues();
  renderCachedData();
  var dayData = await getData();
  cacheData(dayData);
  renderDataInHtml(dayData);
}

main();