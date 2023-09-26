import LOGO_GOOGLE from '@/assets/logo-google.svg';
import LOGO_WECHAT from '@/assets/logo-wechat.svg';

const DEV = process.env.NODE_ENV === 'development';

export const LOCALE_ENABLED = true;
export const DEFAULT_LOCALE = 'zh-CN';

export enum AuthType {
  Google = 'Google',
  Twitter = 'Twitter',
  Wechat = 'Wechat',
}

export const Configure: {
  // 显示Activity页
  activity: boolean;
  // 显示我的作品页
  collection: boolean;
  // 显示Profile页
  profile: boolean;
  // 显示Readme页
  readme: boolean;
  // 联系画师功能，需要用户填写的联系方式
  contactArtist: {
    email: boolean;
    telegram: boolean;
  };
  // 显示分享到推特
  shareToTwitter: boolean;
  // 显示平行宇宙模块
  parallelUniverse: boolean;
  // 提示词使用的语言，即 createCreativeTask 和 createCreativeAdvancedTask 接口的 lang 参数
  promptLocale: API.AigcSupportedLang;
  // 支持充值的方式，即 pointsPrices 接口的 channel 参数
  rechargeChannel: API.PurchaseChannelId[];
  // 支持的第三方登录方式
  authorization: {
    type: AuthType;
    url: string; // 若为空，点击后提示 Coming soon
    enabled: boolean; // 是否显示该登录方式
    background: string;
    color: string;
    icon: string;
    label: string;
  }[];
  // 训练微调模型
  fineTune: {
    pollingInterval: number; // 模型训练轮询时长，毫秒
    imageCount: Record<API.FineTuneType, { min: number; max: number }>;
    imageCompressThreshold: number; // 单位MB
  };
} = {
  activity: false,
  collection: false,
  profile: false,
  readme: false,
  contactArtist: {
    email: true,
    telegram: false,
  },
  shareToTwitter: false,
  parallelUniverse: false,
  promptLocale: 'EN',
  rechargeChannel: [],
  authorization: [
    {
      type: AuthType.Google,
      url: 'https://aiverse.me/auth/google-redirect',
      enabled: true,
      background: '#ffffff',
      color: 'rgb(0 0 0 / 85%)',
      icon: LOGO_GOOGLE,
      label: 'user.sign-in-with-google',
    },
    {
      type: AuthType.Twitter,
      url: '',
      enabled: false,
      background: '#1D9BF0',
      color: 'rgb(255 255 255 / 85%)',
      icon: '',
      label: 'user.sign-in-with-twitter',
    },
    {
      type: AuthType.Wechat,
      url: 'https://aiverse.me/auth/wechat-redirect',
      // url: '',
      enabled: true,
      background: '#00bc0c',
      color: 'rgb(255 255 255 / 85%)',
      icon: LOGO_WECHAT,
      label: 'user.sign-in-with-wechat',
    },
  ],
  fineTune: {
    pollingInterval: 30 * 1000,
    imageCount: {
      PERSON: {
        min: 15,
        max: 20,
      },
      STYLE: {
        min: 25,
        max: 30,
      },
    },
    imageCompressThreshold: 1,
  },
};
