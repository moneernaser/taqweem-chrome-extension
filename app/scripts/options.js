'use strict';

$(document).ready(function () {

    // extension version
    var manifestData = chrome.runtime.getManifest();
    console.log(manifestData.version);
    console.log(JSON.stringify(manifestData));
    $(".release_number").text(manifestData.version);
    $("#submit-settings").click(function () {
        var method = parseInt($('#method_select').val());
        chrome.storage.sync.set({ 'adan_method': method });
    });

    chrome.storage.sync.get('adan_method', function (_ref) {
        var adan_method = _ref.adan_method;

        $('#method_select').val(adan_method || 2);
    });

    function showOrHideTabsOnClick() {
        var activeIndex = $('.active-tab').index(),
            $contentlis = $('.tabs-content li'),
            $tabslis = $('.tabs li');

        // Show content of active tab on loads
        $contentlis.eq(activeIndex).show();

        $('.tabs').on('click', 'li', function (e) {
            var $current = $(e.currentTarget),
                index = $current.index();

            $tabslis.removeClass('active-tab');
            $current.addClass('active-tab');
            $contentlis.hide().eq(index).show();
        });
    }

    showOrHideTabsOnClick();
});