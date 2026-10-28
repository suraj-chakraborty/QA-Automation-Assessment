import { Given, When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import { SelfHealDemoPage } from '../../pages/emi/SelfHealDemoPage';

Given(
  'I am on the EMI calculator home page for self-healing',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = new SelfHealDemoPage(this.page!);
    await selfHealPage.open();
    this.setTestData('selfHealPage', selfHealPage);
  }
);

When(
  'I attempt to interact using a brittle positional CSS selector',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = this.getTestData<SelfHealDemoPage>('selfHealPage');
    await selfHealPage.triggerBrokenPositionalCss();
  }
);

When(
  'I attempt to interact using a stale dynamic ID selector',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = this.getTestData<SelfHealDemoPage>('selfHealPage');
    await selfHealPage.triggerBrokenStaleDynamicId();
  }
);

When(
  'I attempt to interact using an absolute indexed XPath selector',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = this.getTestData<SelfHealDemoPage>('selfHealPage');
    await selfHealPage.triggerBrokenAbsoluteXPath();
  }
);

When(
  'I attempt to interact using an invalid accessible name role selector',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = this.getTestData<SelfHealDemoPage>('selfHealPage');
    await selfHealPage.triggerBrokenAccessibleName();
  }
);

When(
  'I attempt to interact using a missing data-testid selector',
  async function (this: CustomWorld): Promise<void> {
    const selfHealPage = this.getTestData<SelfHealDemoPage>('selfHealPage');
    await selfHealPage.triggerBrokenMissingTestId();
  }
);
