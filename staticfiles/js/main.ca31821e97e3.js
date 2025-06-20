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

    // 自動リサイズテキストエリア
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // ページ読み込み時に初期化＋入力イベントをバインド
    $(document).ready(function () {
        $('.auto-resize').each(function () {
            const textarea = this;
            let resizeQueued = false;

            // 初期リサイズ
            autoResizeTextarea(textarea);

            // 入力イベントにバインド（requestAnimationFrameで最適化）
            $(textarea).on('input', function () {
                if (!resizeQueued) {
                    resizeQueued = true;

                    requestAnimationFrame(() => {
                        autoResizeTextarea(textarea);
                        resizeQueued = false;
                    });

                    // 念のための2回目（遅延後）
                    setTimeout(() => {
                        autoResizeTextarea(textarea);
                    }, 1500);
                }
            });
        });
    });

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

