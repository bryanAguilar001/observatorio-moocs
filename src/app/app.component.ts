import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Record } from './models/record.model';
import { DataService } from './services/data.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import More from 'highcharts/highcharts-more';
More(Highcharts);
import Tree from 'highcharts/modules/treemap';
Tree(Highcharts);
import Heatmap from 'highcharts/modules/heatmap';
Heatmap(Highcharts);

import HighchartsMap from "highcharts/modules/map";
import { ModalCoursesComponent } from './view/modal-courses/modal-courses.component';
HighchartsMap(Highcharts);

import { Chart } from 'angular-highcharts';

declare let $: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  //Para los histogramas
  Highcharts: typeof Highcharts = Highcharts;

  //Actualización en gráfico de TreeMap Dominio
  updateFlag3 = false;
  //Actualización en gráfico de TreeMap DurationWeek
  updateFlag4 = false;
  //Actualización en gráfico de SnackBar Platforms
  updateFlag6 = false;

  // snackbar (registros mooc/cpoc/nooc por unversidad)
  categoriesCourses = [];
  seriesInstitutions = [];

  //Variable spara almacenar datos
  // global Indicator (MOOC/NOOC/SPOC)
  indicatorGlobal : string = '';

  // Stacked Bar (registros mooc/cpoc/nooc por unversidad)
  coursesStackedBarChart = new Chart();

  // Stacked Bar (plataformas por institución)
  platformsStackedBarChart = new Chart();

  data = [];
  cards = [];
  courses = [];
  categories = [];
  domains = [];
  durations = [];
  dedications = [];

  constructor(private ds: DataService, private modalService: BsModalService,) { }

  ngOnInit(): void {
    this.ds.getData().subscribe((data: Record[]) => {
      this.data = data;
      let indicator: string = 'MOOC';
      this.indicatorGlobal = indicator;
      this.generateCards();
      this.generateCoursesCountGraph(indicator);
      this.generateDomainCoursesCountGraph(indicator);
      this.generateDurationCoursesCountGraph(indicator);
      this.generateDedicationCoursesCountGraph(indicator);
      this.generatePlatformCountGraph();
    });
    
  }

  updateGraphs(indicator: string, index: number) {

    this.indicatorGlobal = indicator;

    //Control de card activada y desactivada
    for (var _i = 0; _i < this.cards.length; _i++) {
      if (index === _i) {
        this.cards[_i].select = true;
      } else {
        this.cards[_i].select = false;
      }
    }

    this.generateCoursesCountGraph(indicator);
    this.generateDomainCoursesCountGraph(indicator);
    this.generateDurationCoursesCountGraph(indicator);
    this.generateDedicationCoursesCountGraph(indicator);
  }

  generateCards() {
    let item, arr = [];
    let cont: number = 0;
    for (item of this.data) {
      arr.push(item.mooc_spooc);
    }
    let counts = this.getCount(arr);
    for (const property in counts) {
      cont++;
      if (cont == 1) {
        this.cards.push({ type: property, value: counts[property], select: true });
      } else {
        this.cards.push({ type: property, value: counts[property], select: false });
      }
    }
  }

  generateCoursesCountGraph(indicator: string) {

    // generate data 
    let item, key, arrInst = [], arrTypeInst = [];
    let universitiesMap = new Map();
    let auxInstTypeMap = new Map();
    let instTypeMap = new Map();

    // get universities map
    for (item of this.data) {
      if ((item.mooc_spooc === indicator)) {
        key = item.institucion.trim();
        if (universitiesMap.has(key)) {
          universitiesMap.get(key).push(item);
        } else {
          universitiesMap.set(key, [item]);
        }
  
        key = item.tipo_institucion.trim().toLowerCase();
        auxInstTypeMap.set(key, 0);
        instTypeMap.set(key, []);
        
        arrTypeInst.push(item.tipo_institucion.trim().toLowerCase());
        arrInst.push(item.institucion.trim());
      }
    }
    // console.log(universitiesMap);
    // console.log(auxInstTypeMap);
    // console.log(instTypeMap);


    // get institutions type
    let counts = this.getCount(arrTypeInst);
    arrTypeInst = [];
    for (const property in counts) {
      arrTypeInst.push({ name: property, value: counts[property] });
    }
    arrTypeInst.sort(this.compareWithValueField);
    // console.log(arrTypeInst);

    // get universities
    counts = this.getCount(arrInst);
    arrInst = [];
    for (const property in counts) {
      arrInst.push({ name: property, value: counts[property] });
    }
    arrInst.sort(this.compareWithValueField);
    // console.log(arrInst);


    let record, tipo_institucion;
    for (item of arrInst) {
      // console.log({name: item.name});
      // console.log(universitiesMap.get(item.name));
      for (record of universitiesMap.get(item.name)) {
        tipo_institucion = record.tipo_institucion.trim().toLowerCase();
        auxInstTypeMap.set(tipo_institucion, (auxInstTypeMap.get(tipo_institucion)+1));
        // console.log(platform);
      }
      // console.log(auxPlatformMap);
      for (let [key, value] of auxInstTypeMap) {
        instTypeMap.get(key).push(value);
      }
      auxInstTypeMap = this.getEmptyMap(auxInstTypeMap);
    }
    // console.log(instTypeMap);

    let categoriesCourses = [];
    let seriesInstitutions = [];
    // categories
    for (item of arrInst) {
      categoriesCourses.push(item.name);
    }
    // console.log(categoriesCourses);

    // series
    for (let [key, value] of instTypeMap) {
      seriesInstitutions.push({ name: this.capitalize(key), type : 'bar', data: value });
    }
    // console.log(seriesInstitutions);

    let chart = new Chart({
      chart: {
        type: "bar"
      },
      title: {
        text: `Número de Registros ${this.indicatorGlobal} por Universidad`
      },
      xAxis: {
        categories: categoriesCourses
      },
      yAxis: {
        min: 0,
        title: {
          text: `Recuento de ${this.indicatorGlobal}`
        }
      },
      plotOptions: {
        series: {
          stacking: "normal"
        }
      },
      credits: {
        enabled: false
      },
      tooltip: {
        backgroundColor: '#fff',
        borderRadius: 0.0,
        borderWidth: 0.0,
        padding: 15.0,
        useHTML: true,
        enabled: true,
        animation: false,
        distance: 25,
        followTouchMove: true,
        hideDelay: 2000,
        style: { "color": "black", "cursor": "default", "fontSize": "12px", "pointerEvents": "auto", "whiteSpace": "normal" },
        formatter: function () {
          return this.x + '<br><b>Número de cursos: ' + this.y + '<b><br><a href="#" class="tooltip-platform">www.' + this.x + '.com</a>';
        }
      },
      series: seriesInstitutions
    });

    this.coursesStackedBarChart = chart;

  }

  generateDomainCoursesCountGraph(indicator: string) {
    // generate data
    this.domains = [];
    let item, arr = [];
    for (item of this.data) {
      (item.mooc_spooc === indicator) && arr.push(item.dominio_aprendizaje);
    }
    let counts = this.getCount(arr);
    for (const property in counts) {
      this.domains.push({ name: property, value: counts[property], colorValue: 1 });
    }
    this.domains.sort(this.compareWithValueField);
    for (item of this.domains) {
      item.colorValue = item.value;
    }

    // update graph
    this.chartOptions3.series[0] = {
      type: 'treemap',
      data: this.domains
    }
    this.updateFlag3 = true;
  }

  generateDurationCoursesCountGraph(indicator: string) {
    // generate data
    this.durations = [];
    let item, label, a, b, arr = [];
    for (item of this.data) {
      if (item.mooc_spooc === indicator) {
        a = item.duracion_semanas.split('/');
        if (a[0].includes("semana")) {
          b = a[0].split(' ');
          label = (b[0] === '1') ? (b[0] + ' semana') : (b[0] + ' semanas');
        } else {
          label = a[0];
        }
        arr.push(label);
      }
    }
    let counts = this.getCount(arr);
    for (const property in counts) {
      this.durations.push({ name: property, value: counts[property], colorValue: 1 });
    }
    this.durations.sort(this.compareWithValueField);
    for (item of this.durations) {
      item.colorValue = item.value;
    }

    // update graph
    this.chartOptions4.series[0] = {
      type: 'treemap',
      data: this.durations
    }
    this.updateFlag4 = true;
  }

  generateDedicationCoursesCountGraph(indicator: string) {
    // generate data 
    this.dedications = [];
    let item, label, a, b, arr = [];
    for (item of this.data) {
      if (item.mooc_spooc === indicator) {
        a = item.dedicacion_horas_semanas.split('/');
        if (a[0].includes("hora")) {
          b = a[0].split(' ');
          if (Number(b[0].trim())) {
            label = { institution: item.institucion, dedication: Number(b[0].trim()) };
            arr.push(label);
          }
        }
      }
    }

    arr.sort(this.compareWithInstitutionField);
    let institution = (arr[0]) ? arr[0].institution : '';
    let sum: number = 0, cont: number = 0, counts = [];
    for (item of arr) {
      if (item.institution === institution) {
        sum += Number(item.dedication);
        cont++;
      } else {
        counts.push({ name: institution, value: (Math.round((sum / cont) * 100) / 100), colorValue: 1 });
        institution = item.institution;
        sum = Number(item.dedication);
        cont = 1;
      }
    }
    counts.push({ name: item.institution, value: (sum / cont), colorValue: 1 });
    this.dedications = counts;
    this.dedications.sort(this.compareWithValueField);
    let i: number = 1;
    for (item of this.dedications) { item.colorValue = i++; }
  }

  generatePlatformCountGraph() {
    // generate data 
    let item, key, arrInst = [], arrPlat = [];
    let universitiesMap = new Map();
    let auxPlatformMap = new Map();
    let platformMap = new Map();

    // get universities map
    for (item of this.data) {
      key = item.institucion.trim();
      if (universitiesMap.has(key)) {
        universitiesMap.get(key).push(item);
      } else {
        universitiesMap.set(key, [item]);
      }

      key = item.plataforma.trim().toLowerCase();
      auxPlatformMap.set(key, 0);
      platformMap.set(key, []);
      
      arrPlat.push(item.plataforma);
      arrInst.push(item.institucion);
    }
    // console.log(universitiesMap);
    // console.log(auxPlatformMap);
    // console.log(platformMap);
    

    // get platforms
    let counts = this.getCount(arrPlat);
    arrPlat = [];
    for (const property in counts) {
      arrPlat.push({ name: property, value: counts[property] });
    }
    arrPlat.sort(this.compareWithNameField);
    // console.log(arrPlat);

    // get universities
    counts = this.getCount(arrInst);
    arrInst = [];
    for (const property in counts) {
      arrInst.push({ name: property, value: counts[property] });
    }
    arrInst.sort(this.compareWithValueField);
    // console.log(arrInst);

    let record, platform;
    for (item of arrInst) {
      // console.log({name: item.name});
      // console.log(universitiesMap.get(item.name));
      for (record of universitiesMap.get(item.name)) {
        platform = record.plataforma.trim().toLowerCase();
        auxPlatformMap.set(platform, (auxPlatformMap.get(platform)+1));
        // console.log(platform);
      }
      // console.log(auxPlatformMap);
      for (let [key, value] of auxPlatformMap) {
        platformMap.get(key).push(value);
      }
      auxPlatformMap = this.getEmptyMap(auxPlatformMap);
    }
    // console.log(platformMap);

    let categoriesPlatforms = [], seriesPlatforms = [];
    // categories
    for (item of arrInst) {
      categoriesPlatforms.push(item.name);
    }
    // console.log(this.categoriesPlatforms);

    // series
    for (let [key, value] of platformMap) {
      seriesPlatforms.push({ name: this.capitalize(key), type : 'bar', data: value });
    }
    // console.log(this.seriesPlatforms);

    let chart = new Chart({
      chart: {
        type: "bar"
      },
      title: {
        text: `Plataformas por Institución`
      },
      xAxis: {
        categories: categoriesPlatforms
      },
      yAxis: {
        min: 0,
        title: {
          text: `Recuento de MOOC/SPOC/NOOC`
        }
      },
      plotOptions: {
        series: {
          stacking: "normal"
        }
      },
      credits: {
        enabled: false
      },
      tooltip: {
        backgroundColor: '#fff',
        borderRadius: 0.0,
        borderWidth: 0.0,
        padding: 15.0,
        useHTML: true,
        enabled: true,
        animation: false,
        distance: 25,
        followTouchMove: true,
        hideDelay: 2000,
        style: { "color": "black", "cursor": "default", "fontSize": "12px", "pointerEvents": "auto", "whiteSpace": "normal" },
        formatter: function () {
          return this.x + '<br> <b>Plataforma utilizada: </b>' + this.series.name + '<b><br>Número de cursos: ' + this.y + '</b>';
        }
      },
      series: seriesPlatforms
    });

    this.platformsStackedBarChart = chart;
  }

  // Helpers Functions
  capitalize(str, lower = false) {
    return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
  }

  getEmptyMap (map: Map<any, any>) {
    let aux = new Map();
    for (let [key, value] of map) {
      aux.set(key, 0);
    }
    return aux;
  }

  getCount(arr) {
    let i, counts = {};
    for (i = 0; i < arr.length; i++) {
      counts[arr[i].trim()] = 1 + (counts[arr[i].trim()] || 0);
    }
    return counts;
  }

  compareCoursesCount(a, b) {
    if (a.y > b.y) return -1;
    if (b.y > a.y) return 1;
    return 0;
  }

  compareWithValueField(a, b) {
    if (a.value > b.value) return -1;
    if (b.value > a.value) return 1;
    return 0;
  }

  compareWithNameField(a, b) {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    return 0;
  }

  compareWithInstitutionField(a, b) {
    if (a.institution > b.institution) return 1;
    if (b.institution > a.institution) return -1;
    return 0;
  }

  ngAfterViewInit(): void {

    $(document).ready(function () {
      $(document).on('click', '.comment_triger', function (e) {
        e.preventDefault();
        alert("Yahooooooooooo");
      });
      $(document).on('click', '.tooltip-platform', function (e) {
        e.preventDefault();
        console.log(e.originalEvent.target.innerText);
      });
    });
  }

  // Tree Map Domain
  chartOptions3: Highcharts.Options = {

    chart: {
      style: {
        fontFamily: 'Poppins'
      }
    },
    colorAxis: {
      minColor: '#e3f2fd',
      maxColor: '#0d47a1',
    },
    tooltip: {
      backgroundColor: '#fff',
      borderRadius: 0.0,
      borderWidth: 0.0,
      padding: 10.0,
      useHTML: true,
      enabled: true,
      animation: false,
      hideDelay: 500,
      style: { "color": "black", "cursor": "default", "fontSize": "12px", "pointerEvents": "auto", "whiteSpace": "normal" },
      formatter: function () {
        return this.point.name + '<p><b>Número de MOOC: </b>' + this.point.value + ' cursos<p>';
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      type: 'treemap',
      data: [{
        name: 'Ciencias aplicadas',
        value: 6,
        colorValue: 1
      }, {
        name: 'Estudios Sociales',
        value: 6,
        colorValue: 2
      }, {
        name: 'Matematicas',
        value: 4,
        colorValue: 3
      }, {
        name: 'lenguaje y literatura',
        value: 3,
        colorValue: 4
      }, {
        name: 'E',
        value: 2,
        colorValue: 5
      }, {
        name: 'F',
        value: 2,
        colorValue: 6
      }, {
        name: 'Gastronomia',
        value: 1,
        colorValue: 7
      }],
      events: {
        click: (event) => {
          let cardSelected = this.cards.find(element => element.select);
          // console.log(event.point.name);
          // console.log(cardSelected.type);
          this.openModal(event.point.name, cardSelected.type);
        },
      }
    }],
    title: {
      text: 'Dominios de aprendizaje'
    }
  };

  modalRef: BsModalRef;

  openModal(domain: string, courseType: string) {
    const initialState = {
      list: [
        domain,
        courseType
      ]
    };
    this.modalRef = this.modalService.show(ModalCoursesComponent,
      { class: 'modal-dialog-centered', initialState }
    );
    this.modalRef.content.closeBtnName = 'Close';

    this.modalRef.content.event.subscribe(res => {
      //this.itemList.push(res.data);
      console.log(res.data);
    });
  }

  /**
   * Modal methods
   * @type {BsModalRef}
  */
  public modalRefAboutUs: BsModalRef;


  /**
   * Allows to open and close the modal terms and conditions
   * @param {TemplateRef<any>} template - Identifier of the modal HTML tag
  */
  openModal_aboutus(template: TemplateRef<any>) {
    this.modalRefAboutUs = this.modalService.show(template);
    this.modalRefAboutUs.setClass('modal-dialog-centered');
  }

  /**
  * Move between sections of the page
  * @param {HTMLElement} element - HTML identifier
  * @return {void} Nothing
 */
  moveSection(element: HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth' });
  }

  // Tree Map DurationWeek
  chartOptions4: Highcharts.Options = {

    chart: {
      style: {
        fontFamily: 'Poppins'
      }
    },
    colorAxis: {
      minColor: '#fff',
      maxColor: '#007E33',
    },
    credits: {
      enabled: false
    },
    tooltip: {
      backgroundColor: '#fff',
      borderRadius: 0.0,
      borderWidth: 0.0,
      padding: 10.0,
      useHTML: true,
      enabled: true,
      animation: false,
      hideDelay: 500,
      style: { "color": "black", "cursor": "default", "fontSize": "12px", "pointerEvents": "auto", "whiteSpace": "normal" },
      formatter: function () {
        return '<p><b>Cursos con duración de ' + this.point.name + '</b>: ' + this.point.value + '<p>';
      }
    },
    series: [{
      type: 'treemap',
      data: [{
        name: 'A',
        value: 6,
        colorValue: 1
      }, {
        name: 'B',
        value: 6,
        colorValue: 2
      }, {
        name: 'C',
        value: 4,
        colorValue: 3
      }, {
        name: 'D',
        value: 3,
        colorValue: 4
      }, {
        name: 'E',
        value: 2,
        colorValue: 5
      }, {
        name: 'F',
        value: 2,
        colorValue: 6
      }, {
        name: 'G',
        value: 1,
        colorValue: 7
      }]
    }],
    title: {
      text: 'Duración en semanas de los cursos'
    }
  };
}
