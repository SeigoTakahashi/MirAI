(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Back to top button
    // $(window).scroll(function () {
    //     if ($(this).scrollTop() > 300) {
    //         $('.back-to-top').fadeIn('slow');
    //     } else {
    //         $('.back-to-top').fadeOut('slow');
    //     }
    // });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");

        // カレンダーの再描画を遅延して呼び出す
        setTimeout(function () {
            if (window.calendar) {
                window.calendar.updateSize();
            }
        }, 500); // CSSトランジションの時間に合わせて調整
        return false;
    });


    // Progress Bar
    $('.pg-bar').waypoint(function () {
        $('.progress .progress-bar').each(function () {
            $(this).css("width", $(this).attr("aria-valuenow") + '%');
        });
    }, { offset: '80%' });

    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: true,
        loop: true,
        nav: false
    });

    // テキストエリアの自動リサイズ＆文字数カウント
    function autoResizeTextarea(textarea) {
        // 一時的にheightをautoにして正確なscrollHeightを取得
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // ページ読み込み完了後に実行
    $(document).ready(function() {
        // 少し遅延を入れてから実行（Vercel環境での安定性向上）
        setTimeout(function() {
            $('.auto-resize').each(function () {
                autoResizeTextarea(this);
                
                // inputイベントリスナーを追加
                $(this).on('input', function () {
                    autoResizeTextarea(this);
                });
            });
        }, 3000); 
    });

    // さらに安全のため、window.onloadでも実行
    $(window).on('load', function() {
        setTimeout(function() {
            $('.auto-resize').each(function () {
                autoResizeTextarea(this);
            });
        }, 3000);
    });

    // MutationObserverを使用してDOM変更を監視（より堅牢な解決策）
    if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // 新しく追加されたtextareaに対してもリサイズを適用
                    $(mutation.addedNodes).find('.auto-resize').each(function() {
                        var self = this;
                        setTimeout(function() {
                            autoResizeTextarea(self);
                        }, 3000);
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // サイズの変更を検知してカレンダーのサイズとテキストエリアを更新
    $(window).on('resize', function () {
        setTimeout(function () {
            // テキストエリアの自動リサイズ
            $('.auto-resize').each(function () {
                autoResizeTextarea(this);
            });

            // カレンダーの再描画
            if (window.calendar) {
                window.calendar.updateSize();
            }
        }, 3000); // 遅延して正しい高さを取得できるようにする（調整可能）
    });

    

    // // 円グラフ
    // var ctx5 = $("#pie-chart").get(0).getContext("2d");
    // var myChart5 = new Chart(ctx5, {
    //     type: "pie",
    //     data: {
    //         labels: ["Italy", "France", "Spain", "USA", "Argentina"],
    //         datasets: [{
    //             backgroundColor: [
    //                 "rgba(0, 156, 255, .7)",
    //                 "rgba(0, 156, 255, .6)",
    //                 "rgba(0, 156, 255, .5)",
    //                 "rgba(0, 156, 255, .4)",
    //                 "rgba(0, 156, 255, .3)"
    //             ],
    //             data: [55, 49, 44, 24, 15]
    //         }]
    //     },
    //     options: {
    //         responsive: true
    //     }
    // });


    // // ドーナツチャート
    // var ctx6 = $("#doughnut-chart").get(0).getContext("2d");
    // var myChart6 = new Chart(ctx6, {
    //     type: "doughnut",
    //     data: {
    //         labels: ["Italy", "France", "Spain", "USA", "Argentina"],
    //         datasets: [{
    //             backgroundColor: [
    //                 "rgba(0, 156, 255, .7)",
    //                 "rgba(0, 156, 255, .6)",
    //                 "rgba(0, 156, 255, .5)",
    //                 "rgba(0, 156, 255, .4)",
    //                 "rgba(0, 156, 255, .3)"
    //             ],
    //             data: [55, 49, 44, 24, 15]
    //         }]
    //     },
    //     options: {
    //         responsive: true
    //     }
    // });


})(jQuery);

