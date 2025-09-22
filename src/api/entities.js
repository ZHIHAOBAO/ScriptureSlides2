import { base44 } from './base44Client';

// 安全的实体导出，确保即使 API 不可用也不会导致错误
export const BiblePresentation = base44?.entities?.BiblePresentation || {
  list: () => {
    console.warn('BiblePresentation.list: API不可用，返回空数组');
    return Promise.resolve([]);
  },
  create: () => {
    console.warn('BiblePresentation.create: API不可用');
    return Promise.reject(new Error('API不可用'));
  },
  update: () => Promise.reject(new Error('API不可用')),
  delete: () => Promise.reject(new Error('API不可用'))
};

export const CommunityBackgroundImage = base44?.entities?.CommunityBackgroundImage || {
  list: () => {
    console.warn('CommunityBackgroundImage.list: API不可用，返回空数组');
    return Promise.resolve([]);
  },
  create: () => {
    console.warn('CommunityBackgroundImage.create: API不可用');
    return Promise.reject(new Error('API不可用'));
  },
  update: () => Promise.reject(new Error('API不可用')),
  delete: () => Promise.reject(new Error('API不可用'))
};

export const UserImage = base44?.entities?.UserImage || {
  list: () => {
    console.warn('UserImage.list: API不可用，返回空数组');
    return Promise.resolve([]);
  },
  create: () => {
    console.warn('UserImage.create: API不可用');
    return Promise.reject(new Error('API不可用'));
  },
  update: () => Promise.reject(new Error('API不可用')),
  delete: () => Promise.reject(new Error('API不可用'))
};

// auth sdk - 改进用户认证相关方法
export const User = base44?.auth || {
  getCurrentUser: () => {
    console.warn('User.getCurrentUser: 认证服务不可用');
    return Promise.resolve(null);
  },
  me: () => {
    console.warn('User.me: 认证服务不可用');
    return Promise.resolve(null);
  },
  login: () => Promise.reject(new Error('认证服务不可用'))
};