import { Component, OnInit, OnDestroy, Output, ViewChild, ChangeDetectorRef} from '@angular/core';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarComponent, PerfectScrollbarDirective
} from 'ngx-perfect-scrollbar';
import { Rgba, ColorPickerService } from '../../../../shared/module/color-picker';
import { FontPickerService } from '../../../../shared/services/font-picker.service';
import { Font, FontInterface, GoogleFontInterface, GoogleFontsInterface } from '../../../../shared/interfaces/font-picker.interfaces';

// tslint:disable-next-line:import-blacklist
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Ng5FilesStatus, Ng5FilesSelected, Ng5FilesConfig, Ng5FilesService } from '../../../../shared/module/ng5-files';
import { VideoStudioService } from '../../../../shared/services/video-studio.service';
import { Masonry, MasonryGridItem } from 'ng-masonry-grid';
import * as path from 'path';

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

  public config: PerfectScrollbarConfigInterface = {};
  public $uns: any = [];

  public selectedDomObject;

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

  // UploadPanel Variables
  private fileUploadConfig: Ng5FilesConfig = {
    // acceptExtensions: ['png', 'jpg', 'jpeg', 'JPEG', 'JPG'],
    acceptExtensions: ['png', 'PNG', 'jpg', 'jpeg', 'gif', 'GIF'],
    maxFilesCount: 5,
    maxFileSize: 5120000,
    totalFilesSize: 10120000
  };
  public props_upload: any = {
    selectedFiles: null,
    uploadedFiles: [],
    _masonry: Masonry
  };


  constructor(private cpServie: ColorPickerService,
    private service: FontPickerService,
    private cdRef: ChangeDetectorRef,
    private ng5FilesService: Ng5FilesService,
    private vsService: VideoStudioService) {
    // Perfect Scrollbar config
    this.config = {
      wheelSpeed: 0.5,
      wheelPropagation: false,
      suppressScrollX: true
    };

    // Background Panel config
    this.props_background.addRecentColor = '#ff0000';
    // tslint:disable-next-line:max-line-length
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
    }, (error: any) => {}));

    this.$uns.push(this.vsService.onAddUploadImage.subscribe((response) => {
      this.props_upload.uploadedFiles.forEach(file => {
        if (file.fakeId === response.guid) {
          file.uim_id = response.uim_id;
          file.src = response.src;
          file.percent = 100;
          file.isLoaded = true;
          file.resolution = response.resolution;
          file.gif_delays = response.gif_delays;
        }
      });
    }));

    this.$uns.push(this.vsService.onLoad.subscribe(() => {
      const uploadedFiles = this.vsService.getUploadImages();
      uploadedFiles.forEach(element => {
        this.props_upload.uploadedFiles.push({
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


    this.$uns.push(this.vsService.onDragEnd.subscribe(() => {
      if ($this.selectedDomObject != null) {
        $this.selectedDomObject.style.opacity = 1;
      }
    }));

    this.ng5FilesService.addConfig(this.fileUploadConfig);
  }
  ngOnDestory() {
    this.$uns.forEach(element => {
      element.unsubscribe();
    });
  }

  mouseDownText($event, font_family, font_size, font_style, text) {
    const object = {
      event: $event,
      type: 'text',
      fontFamily: font_family,
      fontSize: font_size,
      fontStyle: font_style,
      text: text,
      rect: $event.target.getBoundingClientRect()
    };

    this.selectedDomObject = $event.target;
    $event.target.style.opacity = 0;

    this.vsService.dragStart(object);
  }
  mouseUpText($event) {
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
          '' : ':'  + font.styles.find((x: any) => !isNaN(x));

        this.service.loadFont({ family: font.family, style: style, size: font.size });
        this.vsService.loadFontFamily(font.family);
      }
    });
  }

  private loadMoreFonts(): void {
    if (!this.props_font.loading && this.props_font.loadedFonts < this.props_font.currentFonts.length) {
      // tslint:disable-next-line:max-line-length
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
      const object = {
        event: $event,
        type: 'image',
        src: file.src,
        resolution: file.resolution,
        gif_delays: file.gif_delays,
        rect: $event.target.getBoundingClientRect()
      };
      this.selectedDomObject = $event.target;
      $event.target.style.opacity = 0;

      this.vsService.dragStart(object);
    }
  }
  mouseUpImage($event, file) {
    if (this.selectedDomObject) {
      this.selectedDomObject.style.opacity = 1;
    }
  }

  onloadedImage($event) {
    const target = $event.target;
    setTimeout(() => {
      target.style.visibility = 'visible';
    }, 300);
  }

  onMasonryInit($event) {
    this.props_upload._masonry = $event;
  }
  addImageOverlay(file) {
    if (this.props_upload._masonry) {
      this.props_upload._masonry.setAddStatus('add');
      if (file.isLoaded) {
        // this.vsService.addImageOverlay({
        //   src: file.src,
        //   resolution: file.resolution
        // });
      }
    }
  }

  deleteUploadImage($event, file) {
    if (this.props_upload._masonry && file.isLoaded === true) {
      this.props_upload._masonry.removeItem($(event.currentTarget).parent().parent()[0])
      .subscribe((item: MasonryGridItem) => {
        this.vsService._deleteUploadImage(file.uim_id);
        const index = this.props_upload.uploadedFiles.findIndex(f => f.uim_id === file.uim_id);
        this.props_upload.uploadedFiles.splice(index, 1);
      });
    }
  }

  filesSelect(selectedFiles: Ng5FilesSelected): void {
    if (selectedFiles.status !== Ng5FilesStatus.STATUS_SUCCESS) {
        this.props_upload.selectedFiles = selectedFiles.status;
    }
    this.props_upload.selectedFiles = Array.from(selectedFiles.files);
    for (let i = 0; i < this.props_upload.selectedFiles.length; i ++) {
      const file = this.props_upload.selectedFiles[i];
      const ext = path.extname(file.name).toLowerCase();
      // if (ext === '.jpg' || ext === '.png' || ext === '.jpeg') {
      if (ext === '.png' || ext === '.jpeg' || ext === '.gif' || ext === '.jpg') {
        if (!file.$error) {
          const fakeId = this.vsService.fakeId();
          this.vsService._addUploadImage(file, {guid: fakeId});
          this.props_upload.uploadedFiles.push({
            fakeId: fakeId,
            src: '../../../../assets/video-studio/loading.gif',
            percent: 0,
            isLoaded: false,
            resolution: {}
          });
        }
      }
    }
  }
}