declare module 'multiple-cucumber-html-reporter' {
  export interface BrowserMetadata {
    name?: string;
    version?: string;
  }

  export interface PlatformMetadata {
    name?: string;
    version?: string;
  }

  export interface ReporterMetadata {
    browser?: BrowserMetadata;
    device?: string;
    platform?: PlatformMetadata;
    app?: {
      name?: string;
      version?: string;
    };
  }

  export interface CustomDataItem {
    label: string;
    value: string;
  }

  export interface CustomDataBlock {
    title?: string;
    data: CustomDataItem[];
  }

  export interface GenerateOptions {
    jsonDir: string;
    reportPath: string;
    metadata?: ReporterMetadata;
    customData?: CustomDataBlock;
    customMetadata?: boolean;
    pageTitle?: string;
    reportName?: string;
    pageFooter?: string;
    displayDuration?: boolean;
    durationInMS?: boolean;
    displayReportTime?: boolean;
    openReportInBrowser?: boolean;
    saveCollectedJSON?: boolean;
    disableLog?: boolean;
    useCDN?: boolean;
    staticFilePath?: boolean;
    customStyle?: string;
    overrideStyle?: string;
    plainDescription?: boolean;
    hideMetadata?: boolean;
  }

  export function generate(options: GenerateOptions): void;

  const reporter: {
    generate: typeof generate;
  };

  export default reporter;
}
