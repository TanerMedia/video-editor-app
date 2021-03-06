import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import {
    PerfectScrollbarConfigInterface,
    PerfectScrollbarComponent, PerfectScrollbarDirective
} from 'ngx-perfect-scrollbar';
import { ColorPickerService } from '../../../../shared/module/color-picker';
import { FontPickerService } from '../../../../shared/services/font-picker.service';
import { Font, GoogleFontInterface, GoogleFontsInterface } from '../../../../shared/interfaces/font-picker.interfaces';

import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, withLatestFrom, startWith, map, filter, pluck } from 'rxjs/operators';
import { Ng5FilesStatus, Ng5FilesSelected, Ng5FilesConfig, Ng5FilesService } from '../../../../shared/module/ng5-files';
import { VideoStudioService } from '../../../../shared/services/video-studio.service';
import { Masonry, MasonryGridItem } from 'ng-masonry-grid';
import * as path from 'path';
import '@jaames/iro';
import { MyColorpicker } from '../vs-toolbar/colorpicker';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

declare const $: any;

@Component({
    selector: 'app-vs-sidebar-panel',
    templateUrl: './vs-sidebar-panel.component.html',
    styleUrls: ['./vs-sidebar-panel.component.scss']
})
export class VsSidebarPanelComponent implements OnInit {
    @ViewChild(PerfectScrollbarComponent) componentScroll: PerfectScrollbarComponent;
    @ViewChild(PerfectScrollbarDirective) directiveScroll: PerfectScrollbarDirective;
    @ViewChild('textPanelScrollbar') textPanelScrollbar: PerfectScrollbarComponent;

    public props = {
        project: null
    };
    public config: PerfectScrollbarConfigInterface = {};
    public $uns: any = [];
    public colorPicker: MyColorpicker;
    public colorPickerColor: string = '#ffffff';
    public showedTab = 'emojis' || 'stickers' || 'gifs' || 'shapes';
    public selectedDomObject;
    public isDraggingText: boolean = false;

    // BackgroundPanel Variables
    public props_background: any = {
        backgroundRecentColors: null,
        backgroundDefaultPalette1: null,
        backgroundDefaultPalette2: null,
        addRecentColor: null
    };

    // FontPanel Variables
    public props_font: any = {
        loading: false,
        fontAmount: 12,
        loadedFonts: 0,
        googleFonts: [],
        currentFonts: [],
    };

    public renderMore: Subject<any> = new Subject();
    public onScroll$ = new Subject();

    // Search input
    public searchInput = new FormControl(null);

    private imageUploadConfig: Ng5FilesConfig = {
        // acceptExtensions: ['png', 'jpg', 'jpeg', 'JPEG', 'JPG'],
        acceptExtensions: ['png', 'PNG', 'jpg', 'jpeg', 'gif', 'GIF'],
        maxFilesCount: 5,
        maxFileSize: 5120000,
        totalFilesSize: 10120000
    };

    private audioUploadConfig: Ng5FilesConfig = {
        acceptExtensions: ['mp3'],
        maxFilesCount: 5,
        maxFileSize: 5120000,
        totalFilesSize: 10120000
    };

    public props_upload_images: any = {
        selectedFiles: null,
        uploadedFiles: [],
        _masonry: Masonry
    };
    public props_musics: any = {
        selectedFiles: [],
        uploadedFiles: [],
        _masonry: Masonry
    };
    public props_emojis: any = {
        selectedFiles: null,
        emojisFiles: [],
        _masonry: Masonry
    };
    public props_stickers: any = {
        selectedFiles: null,
        stickersFiles: [],
        _masonry: Masonry
    };
    public props_gifs: any = {
        selectedFiles: null,
        gifsFiles: [],
        _masonry: Masonry
    };
    public props_images: any = {
        selectedFiles: null,
        imagesFiles: [],
        _masonry: Masonry
    };

    constructor(
        private cpServie: ColorPickerService,
        private service: FontPickerService,
        private cdRef: ChangeDetectorRef,
        private ng5FilesService: Ng5FilesService,
        private vsService: VideoStudioService,
        private activatedRoute: ActivatedRoute
    ) {
        // Perfect Scrollbar config
        this.config = {
            wheelSpeed: 0.5,
            wheelPropagation: false,
            suppressScrollX: true
        };

        // Uploader config
        // this.ng5FilesService.addConfig(this.allUploadConfig);
        this.ng5FilesService.addConfig(this.audioUploadConfig, 'audio');
        this.ng5FilesService.addConfig(this.imageUploadConfig, 'image');

        // Background Panel config
        this.props_background.addRecentColor = '#ff0000';
        this.props_background.backgroundDefaultPalette1 = ['#6d6fe1', '#0090fa', '#00b9e4', '#49d1fb', '#00dd77', '#ff4b65', '#ff5936', '#ffa82e', '#ffd53c', '#fd109f'];
        this.props_background.backgroundDefaultPalette2 = ['#000000', '#666666', '#a8a8a8', '#d9d9d9', '#ffffff'];

        const localColorData = localStorage.getItem('backgroundRecentColors');
        if (localColorData) {
            this.props_background.backgroundRecentColors = localColorData.split('/');
        } else {
            this.props_background.backgroundRecentColors = [];
        }
    }

    ngOnInit() {
        const $this = this;

        this.colorPicker = new MyColorpicker('.bg-colorpicker');

        this.$uns.push(this.renderMore.pipe(
            debounceTime(150),
            distinctUntilChanged()
        ).subscribe(() => this.loadMoreFonts()));

        this.$uns.push(this.service.getAllFonts('popularity').subscribe((fonts: GoogleFontsInterface) => {
            this.props_font.loading = false;

            if (fonts.items) {
                this.props_font.googleFonts = fonts.items.map((font: GoogleFontInterface) => {
                    return new Font({
                        family: font.family,
                        styles: font.variants,
                        files: font.files,
                        style: null,
                        size: null
                    });
                });
            }
            this.setDisplayedFontSource();
        }, (error: any) => { }));

        this.$uns.push(this.colorPicker.onInputEnd.subscribe((color) => {
            this.colorPickerColor = color;
            this.vsService._changeBackground(color);
        }));

        this.$uns.push(this.vsService.onLoad.subscribe(() => {
            const uploadedFiles = this.vsService.getUploadImages();

            uploadedFiles.forEach(element => {
                this.props_upload_images.uploadedFiles.push({
                    uim_id: element.uim_id,
                    fakeId: '',
                    src: element.uim_path,
                    percent: 0,
                    isLoaded: true,
                    resolution: element.uim_resolution,
                    gif_delays: element.uim_gif_delays
                });
            });
        }));

        this.$uns.push(this.vsService.onLoadWithResult.subscribe(result => {
            this.props.project = result;
        }));

        this.$uns.push(this.vsService.onAddUploadImageProgress.subscribe((response) => {
            this.props_upload_images.uploadedFiles.forEach(image => {
                if (image.fakeId === response.guid) {
                    image.percent = response.percent;
                }
            });
        }));

        this.$uns.push(this.vsService.onAddUploadMusicProgress.subscribe((response) => {
            this.props_musics.uploadedFiles.forEach(music => {
                if (music.fakeId === response.guid) {
                    music.percent = response.percent;
                }
            });
        }));

        this.$uns.push(this.vsService.onAddUploadMusic.subscribe((response) => {
            this.props_musics.uploadedFiles.forEach(music => {
                if (music.fakeId === response.guid) {
                    music.mus_duration = response.mus_duration;
                    music.mus_id = response.mus_id;
                    music.mus_name = response.mus_name;
                    music.mus_path = response.mus_path;
                    music.mus_type = response.mus_type;
                    music.percent = 90;
                    music.isLoaded = false;
                }
            });
        }));

        this.$uns.push(this.vsService.onAddUploadImage.subscribe((response) => {
            this.props_upload_images.uploadedFiles.forEach(file => {
                if (file.fakeId === response.guid) {
                    file.uim_id = response.uim_id;
                    file.src = response.src;
                    file.percent = 100;
                    file.isLoaded = false;
                    file.resolution = response.resolution;
                    file.gif_delays = response.gif_delays;
                }
            });
        }));

        this.$uns.push(this.vsService.onDragEnd.subscribe(() => {
            if ($this.selectedDomObject != null) {
                $this.selectedDomObject.style.opacity = 1;

                if (this.isDraggingText) {
                    this.isDraggingText = false;
                }
            }
        }));

        this.listenToScrollEvent();

        this.$uns.push(
            combineLatest(
                this.searchInput.valueChanges.pipe(
                    startWith(''),
                    debounceTime(500)
                ),
                this.vsService.onGetStaticOverlays,
                this.vsService.onGetMusics
            ).pipe(
                map(([searchValue, overlaysValue, { musics }]: [string, any[], any]) => {
                    const gifs = overlaysValue.filter(value => value.sov_type === 3);
                    const stickers = overlaysValue.filter(value => value.sov_type === 2);
                    const emojis = overlaysValue.filter(value => value.sov_type === 1);

                    this.props_musics.uploadedFiles = musics.map(music => {
                        return {
                            mus_duration: music.mus_duration,
                            mus_id: music.mus_id,
                            mus_name: music.mus_name,
                            mus_path: music.mus_path,
                            mus_type: music.mus_type,
                            isLoaded: true,
                            percent: 0
                        };
                    });

                    this.props_emojis.emojisFiles = emojis.map(emoji => {
                        return {
                            sov_id: emoji.sov_id,
                            sov_name: emoji.sov_name || 'None',
                            fakeId: '',
                            src: emoji.sov_path,
                            percent: 0,
                            isLoaded: true,
                            resolution: emoji.sov_resolution,
                            gif_delays: emoji.sov_gif_delays
                        };
                    });

                    this.props_stickers.stickersFiles = stickers.filter(sticker => sticker.sov_name.indexOf(searchValue) !== -1).map(sticker => {
                        return {
                            sov_id: sticker.sov_id,
                            sov_name: sticker.sov_name || 'None',
                            fakeId: '',
                            src: sticker.sov_path,
                            percent: 0,
                            isLoaded: true,
                            resolution: sticker.sov_resolution,
                            gif_delays: sticker.sov_gif_delays
                        };
                    });

                    this.props_gifs.gifsFiles = gifs.filter(gif => gif.sov_name.indexOf(searchValue) !== -1).map(gif => {
                        return {
                            sov_id: gif.sov_id,
                            sov_name: gif.sov_name || 'None',
                            fakeId: '',
                            src: gif.sov_path,
                            percent: 0,
                            isLoaded: true,
                            resolution: gif.sov_resolution,
                            gif_delays: gif.sov_gif_delays
                        };
                    });

                    this.listenToScrollEvent();
                }),
            ).subscribe()
        );
    }

    ngOnDestory() {
        this.$uns.forEach(element => {
            element.unsubscribe();
        });
    }

    listenToScrollEvent() {
        setTimeout(() => {
            this.onScroll$.next();
        }, 1000);
    }

    showTab(tab) {
        this.showedTab = tab;
        this.listenToScrollEvent();
    }

    onColorHexChange(color: string) {
        this.colorPickerColor = color;
        this.colorPicker.setColor(this.colorPickerColor);
        this.vsService._changeBackground(color);
    }

    onChangeBackground(color) {
        this.vsService._changeBackground(color);
    }

    mouseDownText($event, font_family, font_style, text) {
        var computedFontSize = window.getComputedStyle($event.target).fontSize;

        $event.target.style.opacity = 0;

        this.isDraggingText = true;

        const object = {
            event: $event,
            type: 'text',
            fontFamily: font_family,
            fontSize: parseInt(computedFontSize),
            fontStyle: font_style,
            text: text,
            rect: $event.target.getBoundingClientRect()
        };

        this.selectedDomObject = $event.target;

        this.vsService.dragStart(object);
    }
    mouseUpText($event) {
        this.isDraggingText = false;
        this.selectedDomObject.style.opacity = 1;
    }

    private selectFont(font_family, font_size, font_style) {
        const data = {
            fontFamily: font_family,
            fontSize: font_size,
            fontStyle: font_style,
            text: 'Click here to edit content!'
        };

        this.vsService.addTextOverlay(data);
    }

    private setDisplayedFontSource(): void {
        this.setCurrentFonts(this.props_font.googleFonts);
    }

    private setCurrentFonts(target: Font[]): void {
        if (target !== this.props_font.currentFonts) {
            this.props_font.currentFonts = target;
            this.props_font.loadedFonts = this.props_font.fontAmount;

            const initialFonts = this.props_font.currentFonts.slice(0, this.props_font.fontAmount);
            this.loadGoogleFonts(initialFonts);

            this.cdRef.markForCheck();

            setTimeout(() => {
                this.textPanelScrollbar.directiveRef.scrollToY(0);
            }, 0);
        }
    }

    private loadGoogleFonts(fonts: Font[]): void {
        fonts.slice(0, this.props_font.fontAmount).forEach((font: any) => {
            if (font && font.files && !this.vsService.isLoadedFontFamily(font.family)) {
                const style = (font.styles.indexOf('regular') > -1) ?
                    '' : ':' + font.styles.find((x: any) => !isNaN(x));

                this.service.loadFont({ family: font.family, style: style, size: font.size });
                this.vsService.loadFontFamily(font.family);
            }
        });
    }

    private loadMoreFonts(): void {
        if (!this.props_font.loading && this.props_font.loadedFonts < this.props_font.currentFonts.length) {
            const moreFonts = this.props_font.currentFonts.slice(this.props_font.loadedFonts, this.props_font.loadedFonts + this.props_font.fontAmount);

            this.loadGoogleFonts(moreFonts);

            this.props_font.loadedFonts += moreFonts.length;

            setTimeout(() => {
                this.textPanelScrollbar.directiveRef.update();
            }, 0);

            this.cdRef.markForCheck();
            this.cdRef.detectChanges();
        }
    }

    /*
     * Functions for UploadPanel
     */

    mouseDownImage($event, file) {
        if (file.isLoaded === true) {
            var computedWidth = parseInt(window.getComputedStyle($event.target).width);
            var computedHeight = parseInt(window.getComputedStyle($event.target).height);
            const object = {
                event: $event,
                type: 'image',
                src: file.src,
                resolution: file.resolution,
                width: computedWidth,
                height: computedHeight,
                gif_delays: file.gif_delays,
                rect: $event.target.getBoundingClientRect()
            };
            this.selectedDomObject = $event.target;
            $event.target.style.opacity = 0;

            this.vsService.dragStart(object);
        }

        $event.preventDefault();
    }
    mouseUpImage($event, file) {
        if (this.selectedDomObject) {
            this.selectedDomObject.style.opacity = 1;
        }

        $event.preventDefault();
    }

    onloadedImage($event, file) {
        const target = $event.target;

        setTimeout(() => {
            target.style.visibility = 'visible';

            if (file && file.percent === 100) {
                file.isLoaded = true;
            }
        }, 300);
    }

    onMasonryInit($event) {
        this.props_upload_images._masonry = $event;
    }

    onEmojisMasonryInit($event) {
        this.props_emojis._masonry = $event;
    }

    addImageOverlay(file) {
        if (this.props_upload_images._masonry) {
            this.props_upload_images._masonry.setAddStatus('add');
            if (file.isLoaded) {
                // this.vsService.addImageOverlay({
                //   src: file.src,
                //   resolution: file.resolution
                // });
            }
        }
    }

    deleteUploadImage($event, file) {
        if (this.props_upload_images._masonry && file.isLoaded === true) {
            this.props_upload_images._masonry.removeItem($(event.currentTarget).parent().parent()[0])
                .subscribe((item: MasonryGridItem) => {
                    this.vsService._deleteUploadImage(file.uim_id);
                    const index = this.props_upload_images.uploadedFiles.findIndex(f => f.uim_id === file.uim_id);
                    this.props_upload_images.uploadedFiles.splice(index, 1);
                });
        }
    }

    audiosSelect(selectedFiles: Ng5FilesSelected): void {
        if (selectedFiles.status !== Ng5FilesStatus.STATUS_SUCCESS) {
            this.props_musics.selectedFiles = selectedFiles.status;
        }
        this.props_musics.selectedFiles = Array.from(selectedFiles.files);
        for (let i = 0; i < this.props_musics.selectedFiles.length; i++) {
            const file = this.props_musics.selectedFiles[i];
            const ext = path.extname(file.name).toLowerCase();
            if (ext === '.mp3') {
                if (!file.$error) {
                    const fakeId = this.vsService.fakeId();

                    this.props_musics.uploadedFiles.push({
                        fakeId: fakeId,
                        // src: '../../../../assets/video-studio/loading.gif',
                        percent: 0,
                        isLoaded: false,
                        // resolution: {}
                    });

                    setTimeout(() => {
                        this.vsService._addUploadMusic(file, { guid: fakeId });
                    }, 1000);
                }
            }
        }
    }

    onLoadedAudio(target, file) {
        file.percent = 100;

        setTimeout(() => {
            target.style.visibility = 'visible';
            file.isLoaded = true;
        }, 1000);
    }

    onUseClick(mus_id) {
        this.props.project.mus_id = mus_id;
        this.vsService.changeMusic(mus_id);
    }

    onDeleteClick(mus_id) {
        this.vsService._deleteMusic(mus_id);

        this.$uns.push(this.vsService.onDeleteMusic.subscribe(response => {
            if (response.success) {
                this.props_musics.uploadedFiles.forEach((music, index) => {
                    if (music.mus_id === mus_id) {
                        this.props_musics.uploadedFiles.splice(index, 1);
                    }
                });
            }
        }));
    }

    imagesSelect(selectedFiles: Ng5FilesSelected): void {
        if (selectedFiles.status !== Ng5FilesStatus.STATUS_SUCCESS) {
            this.props_upload_images.selectedFiles = selectedFiles.status;
        }

        this.props_upload_images.selectedFiles = Array.from(selectedFiles.files);

        for (let i = 0; i < this.props_upload_images.selectedFiles.length; i++) {
            const file = this.props_upload_images.selectedFiles[i];
            const ext = path.extname(file.name).toLowerCase();

            if (ext === '.png' || ext === '.jpeg' || ext === '.gif' || ext === '.jpg') {
                if (!file.$error) {
                    const fakeId = this.vsService.fakeId();

                    this.props_upload_images.uploadedFiles.push({
                        fakeId: fakeId,
                        src: '../../../../assets/video-studio/loading.gif',
                        percent: 0,
                        isLoaded: false,
                        resolution: {}
                    });

                    setTimeout(() => {
                        this.vsService._addUploadImage(file, { guid: fakeId });
                    }, 1000);
                }
            }
        }
    }
}
