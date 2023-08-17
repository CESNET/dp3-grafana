import { AttrType, DataSource } from '../datasources/cesnet-dp3-datasource/datasource';

/**
 * EID dashboard generator
 *
 * Generates dashboard based on entity specification.
 */
export class EIDDashboardGenerator {
  readonly NUMERIC_DATA_TYPES = ['int', 'int64', 'float'];

  private etype: string;
  private entitySpec: Record<string, any>;
  private dsInfo: Record<string, any>;
  private exampleEid: string;

  /**
   * Constructs new dashboard generator
   * @param etype      Entity type
   * @param entitySpec Entity specification
   */
  constructor(etype: string, entitySpec: Record<string, any>, ds: DataSource, exampleEid = '') {
    this.etype = etype;
    this.entitySpec = entitySpec;
    this.dsInfo = EIDDashboardGenerator.generateDataSourceInfo(ds);
    this.exampleEid = exampleEid;
  }

  /**
   * Generates datasource information
   * @param ds Data source
   * @return DS info
   */
  static generateDataSourceInfo(ds: DataSource): Record<string, any> {
    return {
      type: ds.type,
      uid: ds.uid,
    };
  }

  private getDashboardBase(): Record<string, any> {
    return {
      title: `${this.entitySpec.name} (${this.etype})`,
      editable: true,
      panels: [],
      time: {
        from: 'now-24h',
        to: 'now'
      },
      templating: {
        list: [
          {
            current: {
              selected: false,
              text: this.exampleEid,
              value: this.exampleEid,
            },
            hide: 0,
            label: 'EID',
            name: 'eid',
            options: [
              {
                selected: true,
                text: this.exampleEid,
                value: this.exampleEid,
              }
            ],
            query: this.exampleEid,
            skipUrlSync: false,
            type: 'textbox'
          }
        ]
      },
    };
  }

  private getCommonPanelConfig(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    return {
      datasource: this.dsInfo,
      title: attrSpec.name || attr,
    };
  }

  private getCommonTargetConfig(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    return {
      refId: 'A',
      datasource: this.dsInfo,
      entity: this.etype,
      eid: '$eid',
      attr: attr,
    };
  }

  private generatePanelForPlainAttr(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    return {
      ...this.getCommonPanelConfig(attr, attrSpec),
      type: 'stat',
      gridPos: { h: 4, w: 12 },
      targets: [{
        ...this.getCommonTargetConfig(attr, attrSpec),
        currentValues: true,
      }],
      options: {
        reduceOptions: {
          calcs: [],
          fields: '/.*/',
          value: false
        },
      },
    };
  }

  private generatePanelForCurrentObsAttr(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    return {
      ...this.getCommonPanelConfig(attr, attrSpec),
      type: 'stat',
      gridPos: { h: 4, w: 12 },
      targets: [{
        ...this.getCommonTargetConfig(attr, attrSpec),
        currentValues: true,
      }],
      options: {
        reduceOptions: {
          calcs: [],
          fields: '/.*/',
          value: false
        },
        textMode: 'value',
      },
    };
  }

  private generatePanelForHistoryObsAttr(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    let panelType = 'table';

    if (attrSpec.multi_value ||
        attrSpec.data_type === 'tag' ||
        attrSpec.data_type === 'binary' ||
        attrSpec.data_type.match(/category.*/)) {
      panelType = 'cesnet-dp3multivaluetimeline-panel';
    } else if (this.NUMERIC_DATA_TYPES.includes(attrSpec.data_type)) {
      panelType = 'timeseries';
    }

    return {
      ...this.getCommonPanelConfig(attr, attrSpec),
      type: panelType,
      gridPos: { h: 12, w: 12 },
      targets: [{
        ...this.getCommonTargetConfig(attr, attrSpec),
        currentValues: false,
      }],
    };
  }

  private generatePanelForTSAttr(attr: string, attrSpec: Record<string, any>): Record<string, any> {
    return {
      ...this.getCommonPanelConfig(attr, attrSpec),
      type: 'timeseries',
      gridPos: { h: 12, w: 12 },
      targets: [{
        ...this.getCommonTargetConfig(attr, attrSpec),
        currentValues: false,
      }],
      fieldConfig: {
        overrides: Object.keys(attrSpec.series).map(serie => {
          return {
            matcher: {
              id: 'byName',
              options: attrSpec.name + '/' + serie
            },
            properties: [
              {
                id: 'custom.axisPlacement',
                value: 'left'
              },
              {
                id: 'unit',
                value: serie
              }
            ]
          };
        }),
      }
    };
  }

  /**
   * Generates dashboard panels
   * @return New panels
   */
  private generatePanels(): Array<Record<string, any>> {
    let panelsPlain: Array<Record<string, any>> = [];
    let panelsObservationsCurrent: Array<Record<string, any>> = [];
    let panelsObservationsHistory: Array<Record<string, any>> = [];
    let panelsTimeseries: Array<Record<string, any>> = [];
    let panels: Array<Record<string, any>> = [];

    let dashboardX = 0;
    let dashboardY = 0;

    const movePanelHalfScreenFn = (p: Record<string, any>, i: number) => {
      if (i === 0) {
        dashboardX = 0;
      }

      p.gridPos.x = dashboardX;

      if (dashboardX === 0) {
        p.gridPos.y = dashboardY;
        dashboardX = 12;
        dashboardY += p.gridPos.h;
      } else {
        dashboardX = 0;
        p.gridPos.y = dashboardY - p.gridPos.h;
      }

      return p;
    };

    // Generate panel for all attributes
    for (const attr in this.entitySpec.attribs) {
      const attrSpec = this.entitySpec.attribs[attr];

      switch (attrSpec.t) {
      case AttrType.PLAIN:
        panelsPlain.push(this.generatePanelForPlainAttr(attr, attrSpec));
        break;

      case AttrType.OBSERVATION:
        panelsObservationsCurrent.push(this.generatePanelForCurrentObsAttr(attr, attrSpec));
        panelsObservationsHistory.push(this.generatePanelForHistoryObsAttr(attr, attrSpec));
        break;

      case AttrType.TIMESERIES:
        panelsTimeseries.push(this.generatePanelForTSAttr(attr, attrSpec));
        break;
      }
    }

    // Add panels and rows with correct Y axis coordinates
    panels.push({ title: 'Plain attributes', gridPos: { h: 1, w: 24, x: 0, y: dashboardY++ }, type: 'row' });
    panels = panels.concat(panelsPlain.map(movePanelHalfScreenFn));
    panels.push({ title: 'Current values of observation attributes', gridPos: { h: 1, w: 24, x: 0, y: dashboardY++ }, type: 'row' });
    panels = panels.concat(panelsObservationsCurrent.map(movePanelHalfScreenFn));
    panels.push({ title: 'History of observation attributes', gridPos: { h: 1, w: 24, x: 0, y: dashboardY++ }, type: 'row' });
    panels = panels.concat(panelsObservationsHistory.map(movePanelHalfScreenFn));
    panels.push({ title: 'Timeseries attributes', gridPos: { h: 1, w: 24, x: 0, y: dashboardY++ }, type: 'row' });
    panels = panels.concat(panelsTimeseries.map(movePanelHalfScreenFn));

    return panels;
  }

  /**
   * Generates JSON dashboard model
   * @return JSON model
   */
  generate(): string {
    let dhb = this.getDashboardBase();
    dhb.panels = this.generatePanels();

    return JSON.stringify(dhb);
  }
};

/**
 * Full overview dashboard generator
 *
 * Generates dashboard based on entity specification.
 */
export class FullOverviewDashboardGenerator {
  private etype: string;
  private entitySpec: Record<string, any>;
  private dsInfo: Record<string, any>;

  /**
   * Constructs new dashboard generator
   * @param etype      Entity type
   * @param entitySpec Entity specification
   */
  constructor(etype: string, entitySpec: Record<string, any>, ds: DataSource) {
    this.etype = etype;
    this.entitySpec = entitySpec;
    this.dsInfo = EIDDashboardGenerator.generateDataSourceInfo(ds);
  }

  /**
   * Generates JSON dashboard model
   * @return JSON model
   */
  generate(): string {
    let dhb = {
      title: `${this.entitySpec.name} (${this.etype}) - full overview`,
      editable: true,
      time: {
        from: 'now',
        to: 'now'
      },
      timepicker: {
        hidden: true
      },
      panels: [{
        datasource: this.dsInfo,
        title: `${this.entitySpec.name} (${this.etype}) - full overview`,
        type: 'table',
        gridPos: { h: 18, w: 24 },
        targets: [{
          refId: 'A',
          datasource: this.dsInfo,
          entity: this.etype,
          currentValues: true,
        }],
        fieldConfig: {
          defaults: {
            custom: {
              filterable: true,
            },
          },
        },
        options: {
          footer: {
            enablePagination: true
          },
        },
      }]
    };

    return JSON.stringify(dhb);
  }
};
