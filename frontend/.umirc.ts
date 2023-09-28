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
  ],
  npmClient: 'yarn',
});

