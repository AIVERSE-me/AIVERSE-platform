import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '@umijs/max',
  },
  routes: [
    {
      path: '/',
      component: './index',
    },
    { path: '/features/figure', component: './features/figure' },
    { path: '/features/style-model', component: './features/style' },
    { path: '/features/ai-product', component: './features/product' },
    { path: '/features/group-photo', component: './features/group-photo' },
  ],
  npmClient: 'yarn',
});

