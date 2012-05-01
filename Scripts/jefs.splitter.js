﻿// courtesy of: jsbin, see http://jsbin.com
// github repo: https://github.com/remy/jsbin

(function (jefs, $) {

    jefs.plugin("splitter", function (options) {

        var $document = $(document),
            $blocker = $('<div class="jefs-block"></div>'),
            settings = {};

        return this.each(function () {
            var $el = $(this),                
                $parent = $el.parent(),
                $prev = $el.prev(),                
                $handle = $('<div class="jefs-resize"></div>'),
                dragging = false,
                width = $parent.width(),
                left = $parent.offset().left,
                refreshTimer = null;            

            function moveSplitter(posX) {
                var i = 0,
                    x = posX - left,
                    split = 100 / width * x;

                if (split > 10 && split < 90) {
                    $el.css('left', split + '%');
                    $prev.css('right', (100 - split) + '%');
                    $handle.css({
                        left: split + '%'
                    });
                    settings.x = posX;
                    clearTimeout(refreshTimer);
                    refreshTimer = setTimeout(function () {
                        // refresh the editors left and right
                        jefs.editors.js.refresh();
                        jefs.editors.html.refresh();
                    }, 100);
                }
            }

            $document.bind('mouseup', function () {
                dragging = false;
                $blocker.remove();
                $handle.css('opacity', '0');
            }).bind('mousemove', function (event) {
                if (dragging) {
                    moveSplitter(event.pageX);
                }
            });

            $blocker.bind('mousemove', function (event) {
                if (dragging) {
                    moveSplitter(event.pageX);
                }
            });

            $handle.bind('mousedown', function (e) {
                dragging = true;
                $('body').append($blocker);

                // blockiframe.contentDocument.write('<title></title><p></p>');

                // TODO layer on div to block iframes from stealing focus
                width = $parent.width();
                left = $parent.offset().left;
                e.preventDefault();
            }).hover(function () {
                $handle.css('opacity', '1');
            }, function () {
                if (!dragging) {
                    $handle.css('opacity', '0');
                }
            });

            function init(event, x) {
                $handle.css({
                    top: 0,
                    // left: (100 / width * $el.offset().left) + '%',
                    bottom: 0,
                    width: 4,
                    opacity: 0,
                    position: 'absolute',
                    'border-left': '1px solid rgba(218, 218, 218, 0.5)',
                    'z-index': 99999
                });

                if ($el.is(':hidden')) {
                    $handle.hide();
                } else {
                    moveSplitter(x || $el.offset().left);
                }
            }

            init(settings.x || $el.offset().left);

            $prev.css('width', 'auto');
            $el.data('splitter', $handle);
            $el.before($handle);
        });
    });

})(this.jefs, jQuery);

