# 血站成分血调拨管理系统

## 项目概述

本系统用于血站成分血的全流程调拨管理，包括库存效期管理、医院预约、冷链交接、温度监控和退回血处理。

## 技术栈

- **前端**: React 18 + Ant Design 5 + TypeScript
- **后端**: NestJS 10 + TypeScript
- **数据库**: PostgreSQL 15 + TypeORM
- **缓存/锁**: Redis (库存预占锁)

## 核心功能

1. **血袋库存管理** - 效期预警、血型批号管理、临近效期优先出库
2. **医院用血预约** - 预约提交、血型匹配、交叉配血校验
3. **冷链交接管理** - 扫码交接、出库校验
4. **温度监控** - 冷链温度记录、超限告警、接收校验
5. **退回血处理** - 退回登记、质量复检、重新入库/报废

## 目录结构

```
blood-allocation-system/
├── backend/          # NestJS 后端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── blood-bag/       # 血袋管理
│   │   │   ├── appointment/     # 预约管理
│   │   │   ├── handover/        # 冷链交接
│   │   │   ├── temperature/     # 温度监控
│   │   │   └── returned/        # 退回血处理
│   │   ├── common/              # 公共模块
│   │   └── main.ts
│   └── package.json
└── frontend/         # React 前端
    ├── src/
    │   ├── pages/
    │   ├── services/
    │   └── App.tsx
    └── package.json
```
