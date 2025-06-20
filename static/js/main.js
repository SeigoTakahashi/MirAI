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

    // 高さをセットする関数
    function setTextareaHeight($textarea) {
        $textarea.css('height', 'auto');
        $textarea.css('height', $textarea[0].scrollHeight + 'px');
    }

    // 自動リサイズの初期化処理
    function initializeAutoResize() {
        $('textarea.auto-resize').each(function () {
        const $this = $(this);
        setTextareaHeight($this);

        // 入力時に高さを再調整（readonlyでも設定OK）
        $this.off('input.autoResize').on('input.autoResize', function () {
            setTextareaHeight($(this));
        });
        });
    }

    // 1. DOM構築後に初期実行（描画完了を保証するため1フレーム遅延）
    requestAnimationFrame(() => {
        initializeAutoResize();
    });

    // 2. 念のため300ms後にも再実行（遅延描画対策）
    setTimeout(() => {
        initializeAutoResize();
    }, 300);

    // 3. textarea の内容が動的に変更されたときも対応（readonlyでもOK）
    const observer = new MutationObserver(() => {
        initializeAutoResize();
    });

    $('textarea.auto-resize').each(function () {
        observer.observe(this, {
        characterData: true,
        childList: true,
        subtree: true
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

    $(window).on('load', function () {
        $('.auto-resize').each(function () {
            autoResizeTextarea(this);
            // 強制的に input イベントを発火
            this.dispatchEvent(new Event('input'));
        });
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

