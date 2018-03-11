
'use strict';

var $ = jQuery;

// show loading spinner when loading data from API
$(document)
    .ajaxStart(function() {
      $("#loading-spinner").show();
        console.log("ajax started");
    })
    .ajaxStop(function() {
      $("#loading-spinner").hide();
      console.log("ajax ended");
});

$('.taq-goto-settings').click(function(event) {
  chrome.runtime.openOptionsPage(function () {});
})

const ADHAN_API = "http://api.aladhan.com/v1/calendar?latitude={0}&longitude={1}&method={2}&month={3}&year={4}"
const HIKMA_API = "https://hikam-api.herokuapp.com/hikma/random"

const ARABIC_MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
const ARABIC_ISLAMIC_MONTHS = ["محرم","صفر","ربيع الأول","ربيع الثاني","جُمادى الأولى","جُمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"]
const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ADANS = ["fajr", "sunrise", "duhr", "asr", "maghrib", "ishaa"]

/**
 * this function adds bidi characters around the string, so it can be displayed in order of concatentation
 * @param {*String} dir either "rtl" or "ltr"
 * @param {*String} str a string
 */
function wrap_dir(dir, str) {
  if (dir === 'rtl') return '\u202B' + str + '\u202C';
  return '\u202A' + str + '\u202C';
}


function format(str, ...params) {
  var args = params;
  return str.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match;
  });
}


function get_api_url(latitude, longitude, method, month, year) {
  return format(ADHAN_API, latitude, longitude, method, month, year);
}


function getPosition() {
  return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej);
  });
}

function fetchAdanData(api_url) {
  console.log("fetchAdanDate(): fetching data from " + api_url);
  return $.get(api_url, function(data) {
    console.log("fetchAdanDate(): data fetched successfully");
  });
}

function daysDiff(d1, d2) {
  let timeDiff = Math.abs(d1.getTime() - d2.getTime());
  let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  return diffDays;
}

function getHikma() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('hikmaRecord', ({hikmaRecord}) => {
      let hikma = undefined, hikmaReceivedAtDate = undefined;
      if (hikmaRecord) {
        [hikma, hikmaReceivedAtDate] = [hikmaRecord.hikma, hikmaRecord.hikmaReceivedAtDate]; 
      }
      if (!hikmaReceivedAtDate || (hikmaReceivedAtDate && new Date().getDate() != hikmaReceivedAtDate)) {
        $.get(HIKMA_API, function(data) {
          let hikma = data[0].body;
          chrome.storage.sync.set({hikmaRecord:{hikmaReceivedAtDate: new Date().getDate(), hikma: hikma}});
          resolve(hikma);
          console.log("Fetched hikma: " + JSON.stringify(data));
        });
      } else {
        resolve(hikma);
      }
    })
  });
}

function getMethod() { 
  return new Promise(resolve => {
    chrome.storage.sync.get('adan_method', ({adan_method}) => {
      console.log("cached method" + adan_method);
      resolve(adan_method || 2);
    });
  });
}


async function getData() {
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();
  let [method, position] = [await getMethod(), await getPosition()]
  let api_url = get_api_url(position.coords.latitude, position.coords.longitude, method, month, year);    
  let [jsonData, hikma] = [await fetchAdanData(api_url), await getHikma()];
  if (jsonData) {
    let daysData = jsonData.data;
    var currentDayData = daysData.find(function(element) {
      let date = element.date.gregorian;
      let day = parseInt(date.day);
      return day == new Date().getDate()
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

  let nowHour = new Date().getHours();
  let nowMin = new Date().getMinutes();
  let AFTER_ISHAA = "23:99"
  let BEFORE_FAJR = "00:00"
  let formattedTimes = [dayData.timings.Fajr, dayData.timings.Sunrise, dayData.timings.Dhuhr, dayData.timings.Asr, dayData.timings.Maghrib, dayData.timings.Isha]
  .map((x) => formatTime(x));
  let upcomingAdanIndex = 0;
  for (let i in formattedTimes) {
    let timeString = formattedTimes[i];
    let hour = timeString.substring(0, timeString.indexOf(":"));
    let min = timeString.substring(timeString.indexOf(":") + 1);
    if (nowHour > parseInt(hour) || (parseInt(hour) == nowHour && nowMin > parseInt(min))) {
      // contine looping
      if (i == formattedTimes.length -1) {
        return "ishaa";
      }
    } else {
      // if we are before fajr, return ishaa (of yesterday)
      if (i == 0) {
        return "ishaa";
      } else {
        return ["fajr", "sunrise", "duhr", "asr", "maghrib", "ishaa"][i-1]
      }
    }
  }
}

function renderKnownValues() {
  let now = new Date();
  let islamicCal = kuwaiticalendar();
   // week day
   $(".taq-day span").text(ARABIC_DAYS[now.getDay()]);

   // miladi year
   $(".taq-year-miladi .taq-value").text(now.getFullYear());
 
   // hijri year
   $(".taq-year-hijri .taq-value").text(islamicCal[7]);
 
   // hijri day
   $(".taq-hijri-day span").text(parseInt(islamicCal[5]))
 
   // miladi day
   $(".taq-miladi-date .taq-miladi-day span").text(now.getDate())
 
   // hijri month name
   $(".taq-hijri-date .taq-month-name span").text(ARABIC_ISLAMIC_MONTHS[islamicCal[6]])
 
   // miladi month name
   $(".taq-miladi-date .taq-month-name span").text(ARABIC_MONTHS[now.getMonth()])

}

function getAdanLetter(adanName) {
  let letters = ["ف", "ش", "ظ", "ع", "م", "ع"]
  return letters[ADANS.indexOf(adanName)];
}

function getAdanAfter(adan, dayData) {
  let times = [dayData.timings.Fajr, dayData.timings.Sunrise, dayData.timings.Dhuhr, dayData.timings.Asr, dayData.timings.Maghrib, dayData.timings.Isha]
  return {
    name: ADANS[(ADANS.indexOf(adan) + 1) % 6],
    time: formatTime(times[(ADANS.indexOf(adan) + 1) % 6])
  }
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
  $(".taq-hijri-day span").text(parseInt(dayData.date.hijri.day))

  // miladi day
  $(".taq-miladi-date .taq-miladi-day span").text(now.getDate())

  // hijri month name
  $(".taq-hijri-date .taq-month-name span").text(dayData.date.hijri.month.ar)

  // miladi month name
  $(".taq-miladi-date .taq-month-name span").text(ARABIC_MONTHS[now.getMonth()])
  
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
  let currentAdan = getCurrentAdan(dayData);
  $(".taq-adan-" + currentAdan).addClass("selected")

  let holidays = dayData.date.hijri.holidays;
  let message = dayData.hikma;
  let title = "حكمة اليوم"
  if (holidays && (holidays.length > 0)) {
    message = holidays[0];
    title = "في مثل هذا اليوم"
  }
  $(".taq-hikma-header span").text(title)
  $(".taq-hikma span").text(message)

}

function cacheData(dayData) {
  chrome.storage.sync.set({'currentDay': dayData});
}

function renderCachedData () {
  chrome.storage.sync.get('currentDay', ({currentDay}) => {
    if (currentDay) {
      console.log("cached: " + currentDay);
      renderDataInHtml(currentDay);
    }
  })
}


async function main() {
  renderKnownValues();
  renderCachedData();
  let dayData = await getData()
  console.log(dayData);
  cacheData(dayData);
  renderDataInHtml(dayData);
  console.log("current: " + getCurrentAdan(dayData));
}

main();