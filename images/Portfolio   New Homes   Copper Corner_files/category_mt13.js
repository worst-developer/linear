var igalleryClass ={
	
	Implements: Options,

    options: {},

	initialize: function(options)
	{
		this.setOptions(options);
		this.imageIndex = 0;
		this.currentHash = '';
		this.zIndex = 0;
		this.lastImageDisplayedIndex = -1;
		this.lightboxShowCounter = 0;
		this.shrinkRatio = 1;
		
		if(this.options.main == 1)
		{
			this.initializeMain();
		}
		
		if(this.options.showThumbs == 1 && this.options.main == 1)
		{
			this.initializeThumbs(this.imageIndex);
		}
		
		if( (this.options.showSlideshowControls == 1 || this.options.slideshowAutostart == 1)  && this.options.main == 1 && this.options.showLargeImage == 1)
		{
			this.initializeSlideShow();
		}
  	},
	
	initializeMain: function()
	{
		var urlImage = this.getUrlParamater('image');

		if(urlImage != 'unset' && this.options.calledFrom != 'module')
		{
			if(urlImage != parseInt(urlImage))
			{
				for(var i=0; i<this.options.jsonImagesImageType.length; i++)
				{
					var fullPath = this.options.jsonImagesImageType[i].filename;
					var origImageName = fullPath.substring(fullPath.indexOf('/') + 1, fullPath.indexOf('/') + 1 + urlImage.length);
					if(origImageName == urlImage)
					{
						this.imageIndex = i;
						break;
					}
				}
			}
			else
			{
				this.imageIndex = urlImage - 1;
			}
		}
  		
		if(this.options.refreshMode == 'hash')
		{
			this.checkHash(false);
			this.checkHashPeriodical = this.checkHash.periodical(400, this, true);
		}
		
		if(this.options.preload == 1 && this.options.showLargeImage == 1)
		{
			this.preloadCounter = 0;
			this.preloaderVar = this.preloadImages.periodical(750, this);
		}
		
		if(this.options.showLargeImage == 1)
		{
			this.swapImage(this.options.jsonImagesImageType[this.imageIndex], 50, this.imageIndex, false, true);
		}
		
		this.boundAddKeyEvent = this.addKeyEvent.bind(this);
		if(this.options.showLargeImage == 1)
		{
			document.addEvent('keydown', this.boundAddKeyEvent);
		}
	},
	
	addKeyEvent: function(event)
	{
		if(event.key == 'right')
		{
			this.clearSlideShow();
			this.slideShowSwap(true);
		}
		if(event.key == 'left')
		{
			this.clearSlideShow();
			this.slideShowSwap(false);
		}
	},
	
	initializeThumbs: function(index)
	{
		var thumbScroller = new Scroller(this.options.thumbContainer, {area: this.options.scrollBoundary, velocity: this.options.scrollSpeed});
		document.id(this.options.thumbTable).addEvent('mouseenter', thumbScroller.start.bind(thumbScroller));
		document.id(this.options.thumbTable).addEvent('mouseleave', thumbScroller.stop.bind(thumbScroller));
		
		var activeThumbId = this.options.prefix + '-' + this.options.uniqueid + '-' + index;
		if( $chk( document.id(activeThumbId) ) )
		{
			var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 50});
			ScrolltoThumb.toElement( document.id(activeThumbId) );
		}
		
		if(this.options.showUpDown == 1)
		{
			this.addArrowBehaviors(this.options.upArrow, -200, 'vertical');
			this.addArrowBehaviors(this.options.downArrow, 200, 'vertical');
		}
		
		if(this.options.showLeftRight == 1)
		{
			this.addArrowBehaviors(this.options.rightArrow, 200, 'horizontal');
			this.addArrowBehaviors(this.options.leftArrow, -200, 'horizontal');
		}
		
		var thumblinksArray = document.id(this.options.thumbTable).getElements('a[class=imglink]');

		thumblinksArray.each(function(el,index)
		{    
			el.addEvent('click', function(e)
			{
        		e = new Event(e).stop();
        		this.clearSlideShow();

				if(this.options.showLargeImage == 0 && this.options.main == 1)
				{
					var imgLink = this.options.jsonImages.general[index].url;
					var imgTargetBlank = this.options.jsonImages.general[index].targetBlank;

					if(imgLink.length > 1)
					{
						el.setStyle('cursor', 'pointer');

						if(imgTargetBlank == 1)
						{
							window.open(imgLink);
						}
						else
						{
							window.location = imgLink;
						}
					}
          			else
          			{
            			this.showLightBox(index);
          			}
        		}
        		else
        		{
					this.swapImage(this.options.jsonImagesImageType[index], this.options.fadeDuration, index, true, false);
				}
        		
      		}.bind(this));

    	}.bind(this));
	},
	
	initializeSlideShow: function()
	{
		this.clearSlideShow();
		
		
		if(this.options.showSlideshowControls == 1)
		{
			document.id(this.options.slideshowForward).removeEvents();
			document.id(this.options.slideshowForward).addEvent('click', function(e)
			{
				this.clearSlideShow();
				this.slideShowSwap(true);
			}.bind(this));
			
			document.id(this.options.slideshowRewind).removeEvents();
			document.id(this.options.slideshowRewind).addEvent('click', function(e)
			{
				this.clearSlideShow();
				this.slideShowSwap(false);
			}.bind(this));
		}
		
		if(this.options.slideshowAutostart == 1 && this.options.showLargeImage == 1)
		{
			this.slideShowStart(false);
		}
	},
	
	checkHash: function(refreshImage)
	{
		var fbUrlParam = this.getUrlParamater('fb_comment_id');

		if(fbUrlParam == 'unset')
		{
			var hashVar = window.location.hash;
	      
			if(hashVar != this.currentHash)
			{
				var dashPos = hashVar.indexOf('-');
				if(dashPos > 0)
				{
					var catid = hashVar.substr(1, dashPos - 1);
					var fileNameClean = hashVar.substr(dashPos + 1);
	  
					if(catid == this.options.uniqueid)
					{
						this.options.jsonImages.main.each(function(el,index)
						{
							if( el.filename.indexOf('/' + fileNameClean + '-') > 0 )
							{
								this.imageIndex = index;
							}
						}.bind(this));
					}
				}
	    
				if(refreshImage == true)
				{
					this.swapImage(this.options.jsonImagesImageType[this.imageIndex], this.options.fadeDuration, this.imageIndex, true, false);
				}
	    
				this.currentHash = hashVar;
			}
		}
	},
    
	addHash : function(imageObject)
	{
		var slashPos = imageObject.filename.indexOf('/');
		var fileNameOnly  = imageObject.filename.substr(slashPos + 1);
		
		var dashPos = fileNameOnly.indexOf('-');
		var fileNameClean  = fileNameOnly.substr(0, dashPos);
		var hashToAdd = this.options.uniqueid + '-' + fileNameClean;
		
		window.location.hash = hashToAdd;
		this.currentHash = '#' + hashToAdd;
	},
	
	getUrlParamater : function (paramTarget)
	{
		var urlValue = 'unset';
		var url = window.location.href;
		
		if(url.indexOf("?") > -1)
		{
			var queryParams = url.substr(url.indexOf("?"));
			var queryParamsArray = queryParams.split("&");
			
			for(var i=0; i< queryParamsArray.length; i++ )
			{
				if( queryParamsArray[i].indexOf(paramTarget + "=") > -1 )
				{
					var paramMatch = queryParamsArray[i].split("=");
					urlValue = paramMatch[1];
					break;
				}
			}
		}
		return unescape(urlValue);
	},
	
	preloadImages : function()
	{
		new Asset.images([this.options.resizePath + this.options.jsonImagesImageType[this.preloadCounter].filename ],
		{
			onComplete: function(){}
		});
		
		this.preloadCounter++;
		
		if(this.preloadCounter == this.options.numPics)
		{
			$clear(this.preloaderVar);
		}
	},
	
	lboxPreloadStarter : function()
	{
		this.preloadCounter = 0;
		this.preloaderVar = this.preloadImages.periodical(750, this);
	},
	
	addArrowBehaviors: function(arrow, pixels, mode)
	{
		var arrowScroller = new Fx.Scroll(this.options.thumbContainer);
		
		document.id(arrow).addEvent('click', function(e)
		{
			var containerSizeArray = document.id(this.options.thumbContainer).getScroll();
			var currentScrollX = containerSizeArray.x;
			var currentScrollY = containerSizeArray.y;
			
			if(mode == 'horizontal')
			{
				arrowScroller.start(currentScrollX + pixels, currentScrollY);
			}
			
			if(mode == 'vertical')
			{
				arrowScroller.start(currentScrollX, currentScrollY + pixels);
			}
		}.bind(this));
	},
	
	slideShowStart : function(instant)
	{
		if(instant == true)
		{
			this.slideShowSwap(true);
		}
	
		this.slideShowObject = this.slideShowSwap.periodical(this.options.slideshowPause, this, true);
		
		if(this.options.showSlideshowControls == 1 && $chk( document.id(this.options.slideshowPlay) )  )
		{
			document.id(this.options.slideshowPlay).setProperty('src', this.options.imageAssetPath + 'pause.jpg');
			document.id(this.options.slideshowPlay).removeEvents();
			document.id(this.options.slideshowPlay).addEvent('click', function(e)
			{
				this.clearSlideShow();
			}.bind(this));
		}
	},
	
	slideShowSwap : function(forward)
	{
		if(forward == true)
		{
			if(this.imageIndex == this.options.numPics - 1)
			{
				this.imageIndex = 0;
			}
			else
			{
				this.imageIndex++;
			}
		}
		else
		{
			if(this.imageIndex == 0)
			{
				this.imageIndex = this.options.numPics - 1;
			}
			else
			{
				this.imageIndex--;
			}
		}
		
		this.swapImage(this.options.jsonImagesImageType[this.imageIndex], this.options.fadeDuration, this.imageIndex, true, false );
	},

	clearSlideShow : function()
	{
		$clear(this.slideShowObject);
	
		if(this.options.showSlideshowControls == 1 && $chk( document.id(this.options.slideshowPlay) ) )
		{
			document.id(this.options.slideshowPlay).setProperty('src', this.options.imageAssetPath + 'play.jpg');
			document.id(this.options.slideshowPlay).removeEvents();
			document.id(this.options.slideshowPlay).addEvent('click', function(e)
			{
				this.slideShowStart(true);
			}.bind(this));
		}
	},
	
	swapImage : function(imageObject, fadeDuration, index, addHash, firstShow)
	{
		this.imageIndex = index;
		
		this.insertImage(imageObject, fadeDuration, this.imageIndex);
		
		if(this.options.main == 1 && this.options.showLargeImage == 1)
		{
			<!--/**this.addMainImageClick(this.imageIndex);**/-->
		} 
		
		if(this.options.showThumbs == 1)
		{
			this.swapThumbsClass(index);
		}
		
		if(this.options.showDescriptions == 1)
		{
			this.swapDescription(index);
		}
		
		if(this.options.showTags == 1)
		{
			this.swapTags(index);
		}
		
		if(this.options.downloadType != 'none')
		{
			this.swapDownload(index);
		}
		
		if(this.options.facebookShare == 1)
		{
			this.swapFacebook(index, imageObject);
		}
		
		if(this.options.showPlusOne == 1)
		{
			this.swapPlusOne(index, imageObject);
		}
		
		if(this.options.allowComments == 2)
		{
			this.swapJcomments(index, imageObject);
		}
		
		if(this.options.allowComments == 4)
		{
			this.swapFbComments(index, imageObject);
		}
		
		if(this.options.reportImage == 1)
		{
			this.swapReportImage(index);
		}
		
		if(this.options.numberingOn == 1)
		{
			this.swapNumbering(index);
		}
		
		if(this.options.allowRating == 2)
		{
			this.swapAlratings(index, imageObject, firstShow);
		}
		
		if(this.options.main == 1)
		{
			if(this.options.refreshMode == 'hash' && addHash == true)
			{
				this.addHash(imageObject);
			}
		}
		
		if(this.options.collectImageViews == 1)
		{
			this.addImageHit();
		}
	},
	
	insertImage : function(imageObject, fadeDuration, index)
	{
		if(this.lastImageDisplayedIndex == index)
		{
			return;
		}
		
		if(this.options.main != 1)
		{
			if(this.options.lboxScalable == 1)
			{
				if(this.shrinkRatio < 1)
				{
					imageObject.width = Math.round(imageObject.width * this.shrinkRatio);
					imageObject.height = Math.round(imageObject.height * this.shrinkRatio);
				}
			}
		}
		
		if(this.lastImageDisplayedIndex >= 0)
		{
			var imageToRemove = this.lastImageDisplayed;
			var imageToRemoveWidth = parseInt(imageToRemove.getStyle('width'));
			var imageToRemoveHeight = parseInt(imageToRemove.getStyle('height'));
		}
		else
		{
			var imageToRemove = null;
			var imageToRemoveWidth = 0;
			var imageToRemoveHeight = 0;
		}
		
		var insertedImages = document.id(this.options.largeImage).getElements('img[class=large_img]');
		var insertedMatch = false;
		
		for(var i=0; i<insertedImages.length; i++)
		{
			var insertedImageId = insertedImages[i].getProperty('id');
			var idSplitted = insertedImageId.split('-');
			var insertedImageCounter = idSplitted[2];
			
			if(insertedImageCounter == index)
			{
				insertedMatch = true;
				imageToInsert = document.id(insertedImageId);
				break;
			}
		}
		
		if(insertedMatch == true)
		{
			var imageToInsertWidth = imageToInsert.getStyle('width').toInt();
			var imageToInsertHeight = imageToInsert.getStyle('height').toInt();
			
			var widthDiff = imageToInsertWidth - imageToRemoveWidth;
			var heightDiff = imageToInsertHeight - imageToRemoveHeight;
			
			if( widthDiff < 5 && widthDiff > -5 && heightDiff < 5 && heightDiff > -5)
			{
				var wait = true;
			}
			else
			{
				var wait = false;
				this.removeImage(fadeDuration, insertedImageId);
			}
			
			imageToInsert.setStyle('z-index', this.zIndex);
			this.zIndex++;
			
			var imageFadeIn = new Fx.Tween(insertedImageId, {property:'opacity', duration:fadeDuration}).start(0,1).chain(function()
			{
				if(wait == true)
				{
					this.removeImage(50, insertedImageId);
				}
				this.lastImageDisplayed = imageToInsert;
				this.lastImageDisplayedIndex = index;
			}.bind(this));
			
			if(this.options.main == true && this.options.magnify == 1 && this.options.lightboxOn == 1)
			{
				this.insertMagnify(index);
			}
		}
		
		else
		{
			if( (Math.abs(parseInt(imageObject.width - imageToRemoveWidth)) < 5) && (Math.abs(parseInt(imageObject.height - imageToRemoveHeight)) < 5) )
			{
				var wait = true;
			}
			else
			{
				var wait = false;
				this.removeImage(fadeDuration, 'ig' + this.options.main + '-' + this.options.uniqueid + '-' + index);
			}
			
			var ImageAsset = new Asset.images([this.options.resizePath + imageObject.filename ],
			{
				onComplete: function()
				{
					var largeImgDivSizeArray = document.id(this.options.largeImage).getSize();
					var imageToInjectLeftMargin = Math.round( (largeImgDivSizeArray.x - imageObject.width) /2 );
					var imageToInjectTopMargin  = Math.round( (largeImgDivSizeArray.y - imageObject.height) /2 );
					
					if(this.options.style == 'grey-border-shadow')
					{
						imageToInjectLeftMargin = imageToInjectLeftMargin - 7;
						imageToInjectTopMargin = imageToInjectTopMargin - 7;
					}
					
					imageToInjectLeftMargin = this.options.imageAlignHoriz == 'left' ? 5 : imageToInjectLeftMargin;
					imageToInjectLeftMargin = this.options.imageAlignHoriz == 'right' ? (largeImgDivSizeArray.x - imageObject.width) - 19 : imageToInjectLeftMargin;
					
					imageToInjectTopMargin = this.options.imageAlignVert == 'top' ? 5 : imageToInjectTopMargin;
					imageToInjectTopMargin = this.options.imageAlignVert == 'bottom' ? (largeImgDivSizeArray.y - imageObject.height) - 19 : imageToInjectTopMargin;
					
					
					ImageAsset.setStyles
					({
						position: 'absolute',
						left: imageToInjectLeftMargin,
						top: imageToInjectTopMargin,
						width: imageObject.width,
						height: imageObject.height,
						opacity: 0,
						'z-index': this.zIndex
					});
					
					this.zIndex++;
					ImageAsset.setProperty('class', 'large_img');
					ImageAsset.setProperty('alt', this.options.jsonImages.general[index].alt);
					var imageAssetId = 'ig' + this.options.main + '-' + this.options.uniqueid + '-' + index;
					ImageAsset.setProperty('id', imageAssetId);
							
					ImageAsset.injectTop( document.id(this.options.largeImage) );
					var ImageAssetInjected = document.id(this.options.largeImage).getElement('img');
					var imageFadeIn = new Fx.Tween(ImageAssetInjected, {property:'opacity',duration:fadeDuration}).start(0,1).chain(function()
					{
						if(wait == true)
						{
							this.removeImage(50, imageAssetId);
						}
						this.lastImageDisplayed = document.id(imageAssetId);
						this.lastImageDisplayedIndex = index;
					  }.bind(this));
					
					if(this.options.main == true && this.options.magnify == 1 && this.options.lightboxOn == 1)
					{
						this.insertMagnify(index);
					}
					
				}.bind(this)
			});
		}
	},
  
	removeImage : function(fadeDuration, currentImgId)
	{
		var insertedImages = document.id(this.options.largeImage).getElements('img[class=large_img]');
	    
		for(var i=0; i<insertedImages.length; i++)
	    {
			var opacity = insertedImages[i].getStyle('opacity');
			
			if(opacity != 0)
			{
				if(insertedImages[i].getProperty('id') != currentImgId)
				{
					this.imageFadeAway = new Fx.Tween(insertedImages[i], {property:'opacity',duration:fadeDuration});
		    		this.imageFadeAway.start(opacity,0);
				}
			}
	    }

		if(this.options.main == 1 && this.options.lightboxOn == 1)
		{
			if (this.options.magnify == 1 && $chk( document.id('magnifygif') ) )
			{
				document.id('magnifygif').dispose();
			}
		}
	},
	
	insertMagnify : function(index)
	{
		var magnifyImage = new Asset.images([this.options.imageAssetPath + 'magnify.gif' ],
		{
			onComplete: function()
			{
				var largeImgDivSizeArray = document.id(this.options.largeImage).getSize();
				var mainImageWidth = this.options.jsonImages.main[index].width;
				var mainImageHeight = this.options.jsonImages.main[index].height;
				
				var magnifyMarginLeft = Math.round( (largeImgDivSizeArray.x - mainImageWidth) /2 ) + mainImageWidth - 27;
				var magnifyMarginTop  = Math.round( (largeImgDivSizeArray.y - mainImageHeight) /2 ) + mainImageHeight - 20;
				
				magnifyImage[0].injectInside(this.options.largeImage).setStyles
				({
					position: 'absolute',
					left: magnifyMarginLeft,
					top: magnifyMarginTop,
					'z-index': 100,
					opacity: 0.7
				});
				
				magnifyImage[0].setProperty('id', 'magnifygif');
			
			}.bind(this)
		});
	},
	
	addMainImageClick : function(index)
	{
		var imgLink = this.options.jsonImages.general[index].url;
		var imgTargetBlank = this.options.jsonImages.general[index].targetBlank;
		
		if(imgLink.length > 1)
		{
			document.id(this.options.largeImage).setStyle('cursor', 'pointer');
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				if (imgTargetBlank == 1)
				{
					window.open(imgLink);
				}
				else
				{
					window.location = imgLink;
				}
			}.bind(this));
		}
		
		if(this.options.lightboxOn == 1 && imgLink.length < 2 )
		{
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).setStyle('cursor', 'pointer');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				this.showLightBox(index);
			}.bind(this));
		}
		
		else if(this.options.lightboxOn == 0 && imgLink.length < 2 )
		{
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				this.clearSlideShow();
				this.slideShowSwap(true);
			}.bind(this));
		}
	},
	
	swapThumbsClass : function(index)
	{
		var thumbCells = document.id(this.options.thumbTable).getElements('td');
		thumbCells.each(function(el,index)
		{
			el.setProperty('class','inactive_thumb');
		}.bind(this));
		thumbCells[index].setProperty('class','active_thumb');
	},
	
	swapDescription : function(index)
	{
		var descriptionDivs = document.id(this.options.desContainer).getElements('div[class=des_div]');
		descriptionDivs.each(function(el,index)
		{
			el.setStyle('display', 'none');
		});
		
		document.id(this.options.desContainer).scrollTo(0,0);
		descriptionDivs[index].setStyle('display', 'block');
	},
  
	swapTags : function(index)
	{
		var tagsDivs = document.id(this.options.tagsContainer).getElements('div[class=tags_div]');
		
		tagsDivs.each(function(el,index)
		{
			el.setStyle('display', 'none');
		});
		
		tagsDivs[index].setStyle('display', 'block');
		
		var taglinks = tagsDivs[index].getElements('a');
		
		if(taglinks.length == 0)
		{
			tagsDivs[index].setStyle('visibility', 'hidden');
		}
	},
	
	swapFacebook : function(index, imageObject)
	{
		var currentUrl = window.location.href;
		if(currentUrl.indexOf("#") > -1)
		{
			currentUrl = currentUrl.substr(0, currentUrl.indexOf("#"));
		}
		
		var urlSymbol = currentUrl.indexOf("?") > -1 ? '&' : '?';
		var filepathArray = imageObject.filename.split('/');
		var fullFilename = filepathArray[1];
		var filenameArray = fullFilename.split('-');
		var OrigFilename =  filenameArray[0] + '-' +  filenameArray[1];
		var urlToShare = currentUrl + urlSymbol + 'image=' + OrigFilename;
		
		var facebookIframe = document.id(this.options.facebookContainer).getElement('iframe');
		var iFrameLink = facebookIframe.getProperty('src');
		var iFrameLinkArray = iFrameLink.split('href=');
		var newiFrameLink = iFrameLinkArray[0] + 'href=' + encodeURIComponent(urlToShare);
		facebookIframe.setProperty('src', newiFrameLink);
	},
	
	swapPlusOne : function(index, imageObject)
	{
		var currentUrl = window.location.href;
		if(currentUrl.indexOf("#") > -1)
		{
			currentUrl = currentUrl.substr(0, currentUrl.indexOf("#"));
		}
		
		var urlSymbol = currentUrl.indexOf("?") > -1 ? '&' : '?';
		var filepathArray = imageObject.filename.split('/');
		var fullFilename = filepathArray[1];
		var filenameArray = fullFilename.split('-');
		var OrigFilename =  filenameArray[0] + '-' +  filenameArray[1];
		var urlToShare = currentUrl + urlSymbol + 'image=' + OrigFilename;
		
		gapi.plusone.render(this.options.plusOneButton,{"href": urlToShare});
	},
	
	swapJcomments : function(index, imageObject)
	{
		if(typeof(jcomments) != 'undefined')
		{
			jcomments.showPage(this.options.idArray[index],'com_igallery',0);
			
			if(! $chk( document.id('comments-form') ) )
			{
				if( $chk( document.id('addcomments') ) )
				{
					var addCommentLink = document.id('addcomments');
					addCommentLink.setProperty('onclick', "jcomments.showForm(" + this.options.idArray[index] + ",'com_igallery\', 'comments-form-link'); return false;");
				}
			}
			else
			{
				var objectIdInput = document.id('comments-form').getElement('input[name=object_id]');
				objectIdInput.setProperty('value', this.options.idArray[index]);
				
				var jcforms = document.id('jc').getElements('form[id=comments-form]');
				jcforms.each(function(el,index)
				{
					if(index != 0)
					{
						el.dispose();
					}
				});
			}
			
			if(this.options.main == 0)
			{
				$clear(this.resetLboxHeightPeriodical);
				var resetLboxHeightPeriodical = this.resetLboxHeight.periodical(750, this);
			}
		}
	},
	
	swapFbComments : function(index, imageObject)
	{
		var currentUrl = window.location.href;
		if(currentUrl.indexOf("#") > -1)
		{
			currentUrl = currentUrl.substr(0, currentUrl.indexOf("#"));
		}
		
		if(currentUrl.indexOf("&fb_comment_id") > -1)
		{
			currentUrl = currentUrl.substr(0, currentUrl.indexOf("&fb_comment_id"));
		}
		
		var urlSymbol = currentUrl.indexOf("?") > -1 ? '&' : '?';
		var filepathArray = imageObject.filename.split('/');
		var fullFilename = filepathArray[1];
		var filenameArray = fullFilename.split('-');
		var OrigFilename =  filenameArray[0] + '-' +  filenameArray[1];
		var urlToShare = currentUrl + urlSymbol + 'image=' + OrigFilename;
		
		var fbContainer = document.id(this.options.facebookCommentsContainer);
		var fbWidth = fbContainer.getStyle('width').toInt();
		
		var fbHtml = '<fb:comments href="' + urlToShare + '" num_posts="' + this.options.facebookCommentsNumPosts + '" width="' + fbWidth + '" colorscheme="' + this.options.facebookColor + '"></fb:comments>';
		fbContainer.set('html',fbHtml);
		FB.init( {appId: this.options.facebookAppid, cookie: true, status: true, xfbml: true} );
		
		if(this.options.main == 0)
		{
			$clear(this.resetLboxHeightPeriodical);
			var resetLboxHeightPeriodical = this.resetLboxHeight.periodical(750, this);
		}
		
	},
	
	resetLboxHeight : function()
	{
		var totalScrollHeight = Window.getScrollHeight();
		document.id(this.options.lboxDark).setStyle('height',totalScrollHeight);
	},
	
	
	swapReportImage : function(index)
	{
		var reportForm = document.id(this.options.reportContainer).getElement('form');
		reportForm.setStyle('display', 'none');
		
		var reportUrl = this.options.host + 'index.php?option=com_igallery&task=image.reportImage&id=' + this.options.idArray[index] + '&catid=' + this.options.catid;
		reportForm.setProperty('action', reportUrl);
		
		var reportLink = document.id(this.options.reportContainer).getElement('a');
		reportLink.removeEvents();
		reportLink.addEvent('click', function(e)
		{
			new Event(e).stop();
			reportForm.setStyle('display', 'block');
		}.bind(this));
	},
	
	swapNumbering : function(index)
	{
		if( $chk( document.id(this.options.numberingContainer) ) )
		{
			document.id(this.options.numberingContainer).getElement('span').set('html', index + 1);
		}
	},
	
	swapDownload : function(index)
	{
		if( $chk( document.id(this.options.downloadId) ) )
		{
			var downloadLink = document.id(this.options.downloadId).getElement('a');
			var linkType = this.options.main == 1 ? 'main' : 'lbox';
			var url = this.options.host + 'index.php?option=com_igallery&task=image.download&format=raw&type=' + linkType + '&id=' + this.options.idArray[index];
			downloadLink.setProperty('href',url);
		}
	},
	
	swapAlratings : function(index, imageObject, firstShow)
	{
		if(this.options.main == 1 && firstShow == true){return;}
		
		var alcontainer = document.id(this.options.alRatingsContainer);
		var imgUrlVar = index + 1;
		
		alcontainer.getElement('.alratings_okeyid').setProperty('value', this.options.idArray[index]);
		alcontainer.getElement('.alratings_otitle').setProperty('value', imageObject.filename.replace(/[0-9]-[0-9]+\//,''));
		alcontainer.getElement('.alratings_olink').setProperty('value', 'index.php?option=com_igallery&view=category&igid=' + this.options.catid + '&image=' + imgUrlVar);
		
		alRatings.refreshRating('com_igallery', this.options.idArray[index]);
	},
	
	addImageHit : function()
	{
		var hitUrl = 'index.php?option=com_igallery&task=image.addHit&format=raw&id=' + this.options.idArray[this.imageIndex];
		var hitAjax = new Request({url: hitUrl, method: 'get', 
		onComplete: function(response){}.bind(this)});
		    
		hitAjax.send();
	},
  
	showLightBox : function(index)
	{
		if(this.lboxGalleryObject.options.preload == 1)
		{
			this.lboxGalleryObject.lboxPreloadStarter();
		}
		
		var bodyTag = document.getElementsByTagName("body").item(0);
		var scrolledDown = Window.getScrollTop();
		var totalScrollHeight = Window.getScrollHeight();
		var windowWidth = Window.getWidth();
		var windowHeight = Window.getHeight();
		var lboxPaddingLeft = document.id(this.options.lboxWhite).getStyle('padding-left').toInt();
		var lboxPaddingRight = document.id(this.options.lboxWhite).getStyle('padding-right').toInt();
		var lboxPadding = (lboxPaddingLeft + lboxPaddingRight) / 2;
		
		if(this.lboxGalleryObject.options.lboxScalable == 1 && this.shrinkRatio == 1)
		{
			var lboxTotalWidth = this.options.lightboxWidth + lboxPaddingLeft + lboxPaddingRight;
			var widthRatio = (windowWidth/lboxTotalWidth) * 0.9;
			
			var lboxTotalHeight = document.id(this.lboxGalleryObject.options.largeImage).measure(function()
			{
				return this.getStyle('height').toInt();
			});
			
			var heightRatio = (windowHeight/lboxTotalHeight) * 0.9;
			
			this.lboxGalleryObject.shrinkRatio = 1;
			
			if(widthRatio < 1 || heightRatio < 1)
			{
				this.shrinkRatio = widthRatio < heightRatio ? widthRatio : heightRatio;
				this.lboxGalleryObject.shrinkRatio = this.shrinkRatio;
			}
		
			if(this.shrinkRatio < 1)
			{
				this.options.lightboxWidth = Math.round(this.options.lightboxWidth *  this.shrinkRatio);
				lboxTotalWidth = Math.round(lboxTotalWidth *  this.shrinkRatio);
				document.id(this.options.lboxWhite).setStyle('width', lboxTotalWidth + 8);
				document.id(this.lboxGalleryObject.options.largeImage).setStyle('width', this.options.lightboxWidth);
				
				lboxTotalHeight = Math.round(lboxTotalHeight *  this.shrinkRatio);
				document.id(this.lboxGalleryObject.options.largeImage).setStyle('height', lboxTotalHeight);
				
				if(this.lboxGalleryObject.options.showThumbs == 1)
				{
					if(this.lboxGalleryObject.options.thumbPostion == 'above' || this.lboxGalleryObject.options.thumbPostion == 'below')
					{
						document.id(this.lboxGalleryObject.options.thumbContainer).setStyle('width', lboxTotalWidth);
					}
					else
					{
						var thumbContainerWidth = document.id(this.lboxGalleryObject.options.thumbContainer).getStyle('width').toInt();
						document.id(this.options.lboxWhite).setStyle('width', lboxTotalWidth + thumbContainerWidth);
					}
				}
				
				if(this.lboxGalleryObject.options.showDescriptions == 1)
				{
					if(this.lboxGalleryObject.options.desPostion == 'above' || this.lboxGalleryObject.options.desPostion == 'below')
					{
						document.id(this.lboxGalleryObject.options.desContainer).setStyle('width', this.lboxTotalWidth);
					}
					else
					{
						var desContainerWidth = document.id(this.lboxGalleryObject.options.desContainer).getStyle('width').toInt();
						var lboxWhiteWidth = document.id(this.options.lboxWhite).getStyle('width').toInt();
						document.id(this.options.lboxWhite).setStyle('width', lboxWhiteWidth + desContainerWidth);
					}
				}
				
				if(this.lboxGalleryObject.options.showSlideshowControls == 1 && this.lboxGalleryObject.options.slideshowPosition == 'left-right')
				{
					document.id(this.lboxGalleryObject.options.slideshowForward).setStyle('padding-top', lboxTotalHeight/2 -15);
					document.id(this.lboxGalleryObject.options.slideshowForward).setStyle('padding-bottom', lboxTotalHeight/2 -15);
					
					document.id(this.lboxGalleryObject.options.slideshowRewind).setStyle('padding-top', lboxTotalHeight/2 -15);
					document.id(this.lboxGalleryObject.options.slideshowRewind).setStyle('padding-bottom', lboxTotalHeight/2 -15);
				}
			}
		}
		
		var whiteDivLeftMargin = (windowWidth / 2) - ( (this.options.lightboxWidth) / 2) - lboxPadding;
		
		if(this.lightboxShowCounter == 0)
		{
			document.id(this.options.lboxWhite).injectTop(bodyTag);
		}
		document.id(this.options.lboxWhite).setStyles
		({
			'top': scrolledDown + 30,
			'left': whiteDivLeftMargin,
			'opacity': '0',
			'display': 'block',
			'float': 'left'
		});
		
		totalScrollHeight = Window.getScrollHeight();
		
		document.id(this.options.lboxDark).injectTop(bodyTag);
		document.id(this.options.lboxDark).setStyles
		({
			'width': '100%',
			'height': totalScrollHeight,
			'top': '0px',
			'left': '0px',
			'opacity': '0',
			'display': 'block'
		});
		
		var darkDivFade = new Fx.Tween(document.id(this.options.lboxDark), {property:'opacity', duration: 1000});
		darkDivFade.start(0,.7);
		
		var whiteDivFadeIn = new Fx.Tween(document.id(this.options.lboxWhite), {property:'opacity', duration: 1000});
		whiteDivFadeIn.start(0,1);
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcommentsClone = document.id('jc').clone(true, true);
			document.id('jc').dispose();
			
			jcommentsClone.injectInside(this.options.jCommentsLbox);
			this.totalScrollHeight = Window.getScrollHeight();
			document.id(this.options.lboxDark).setStyle('height', this.totalScrollHeight);
		}
		
		this.lboxGalleryObject.swapImage(this.options.jsonImages.lbox[index], 0, index, true, false);
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcforms = document.id('jc').getElements('form[id=comments-form]');
			jcforms.each(function(el,index)
			{
				if(index != 0)
				{
					el.dispose();
				}
			});
		}
		
		this.lboxGalleryObject.initializeSlideShow();
		
		document.id(this.lboxGalleryObject.options.largeImage).removeEvents();
		document.id(this.lboxGalleryObject.options.largeImage).addEvent('click', function(e)
		{
			this.lboxGalleryObject.clearSlideShow();
			this.lboxGalleryObject.slideShowSwap(true);
		}.bind(this));
		
		if(this.lboxGalleryObject.options.showThumbs == 1)
		{
			this.lboxGalleryObject.initializeThumbs(index);
		}
		
		document.removeEvent('keydown', this.boundAddKeyEvent);
		this.lboxBoundAddKeyEvent = this.lboxGalleryObject.addKeyEvent.bind(this.lboxGalleryObject);
		document.addEvent('keydown', this.lboxBoundAddKeyEvent);
		
		if($chk(document.id(this.lboxGalleryObject.options.closeImage)))
		{
			document.id(this.lboxGalleryObject.options.closeImage).removeEvents();
			
			document.id(this.lboxGalleryObject.options.closeImage).addEvent('click', function(e)
			{
				this.closeLightBox(index);
			}.bind(this));
		}
		
		document.id(this.options.lboxDark).removeEvents();
		document.id(this.options.lboxDark).addEvent('click', function(e)
		{
			this.closeLightBox(index);
		}.bind(this));
		
		this.lightboxShowCounter++;
		
	},
	
	closeLightBox : function(index)
	{
		this.lboxGalleryObject.clearSlideShow();
		this.lboxGalleryObject.lastImageDisplayedIndex = -1;
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcommentsClone = document.id('jc').clone(true, true);
			document.id('jc').dispose();
			jcommentsClone.injectInside(this.options.jCommentsMain);
			
			jcomments.showPage(this.options.idArray[this.imageIndex],'com_igallery',0);
			
			if(! $chk( document.id('comments-form') ) )
			{
				if( $chk( document.id('addcomments') ) )
				{
					var addCommentLink = document.id('addcomments');
					addCommentLink.setProperty('onclick', "jcomments.showForm(" + this.options.idArray[this.imageIndex] + ",'com_igallery\', 'comments-form-link'); return false;");
				}
			}
			else
			{
				var objectIdInput = document.id('comments-form').getElement('input[name=object_id]');
				objectIdInput.setProperty('value', this.options.idArray[this.imageIndex]);
				
				var jcforms = document.id('jc').getElements('form[id=comments-form]');
				jcforms.each(function(el,index)
				{
					if(index != 0)
					{
						el.dispose();
					}
				});
			}
		}
		
		var darkDivFade = new Fx.Tween(document.id(this.options.lboxDark), {property:'opacity', duration: 100});
		darkDivFade.start(0.7,0).chain(function()
		{
			document.id(this.options.lboxDark).setStyle('display','none');
		}.bind(this));
		
		var whiteDivFadeIn = new Fx.Tween(document.id(this.options.lboxWhite), {property:'opacity', duration: 100});
		whiteDivFadeIn.start(1,0).chain(function()
		{
			document.id(this.lboxGalleryObject.options.largeImage).set('html','');
			document.id(this.options.lboxWhite).setStyle('display','none');
		}.bind(this));
		
		document.removeEvent('keydown', this.lboxBoundAddKeyEvent);
		if(this.options.showLargeImage == 1)
		{
			this.boundAddKeyEvent = this.addKeyEvent.bind(this);
			document.addEvent('keydown', this.boundAddKeyEvent);
		}
	}
};
 
 