import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';

const SETTINGS = {
  CUSTOM_USE_PRESET_ID: {
    key: 'ai-product.custom-use-preset-id',
    value: '',
    description: 'ID',
  },
};

@Injectable()
export class AiProductSettingsService {
  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    const settings = Object.values(SETTINGS);
    for (const setting of settings) {
      await this.settingsService.setDefault(setting);
    }
  }

  async customUsePresetId() {
    return await this.settingsService.get<string>(
      SETTINGS.CUSTOM_USE_PRESET_ID.key,
    );
  }
}
