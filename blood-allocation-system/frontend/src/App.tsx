import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  CarryOutOutlined,
  ThermometerOutlined,
  RollbackOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import BloodBagList from './pages/blood-bag/BloodBagList';
import AppointmentList from './pages/appointment/AppointmentList';
import AppointmentCreate from './pages/appointment/AppointmentCreate';
import HandoverList from './pages/handover/HandoverList';
import HandoverCreate from './pages/handover/HandoverCreate';
import TemperatureMonitor from './pages/temperature/TemperatureMonitor';
import ReturnedList from './pages/returned/ReturnedList';
import ReturnedCreate from './pages/returned/ReturnedCreate';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '首页概览' },
    { key: 'blood-bag', icon: <DatabaseOutlined />, label: '血袋库存' },
    { key: 'appointment', icon: <FileTextOutlined />, label: '用血预约' },
    { key: 'handover', icon: <CarryOutOutlined />, label: '冷链交接' },
    { key: 'temperature', icon: <ThermometerOutlined />, label: '温度监控' },
    { key: 'returned', icon: <RollbackOutlined />, label: '退回血处理' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key);
    window.location.hash = '#/' + (key === 'dashboard' ? '' : key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '血' : '血站调拨系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            fontSize: 20,
            fontWeight: 600,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          血站成分血调拨管理系统
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blood-bag" element={<BloodBagList />} />
            <Route path="/appointment" element={<AppointmentList />} />
            <Route path="/appointment/create" element={<AppointmentCreate />} />
            <Route path="/handover" element={<HandoverList />} />
            <Route path="/handover/create" element={<HandoverCreate />} />
            <Route path="/temperature" element={<TemperatureMonitor />} />
            <Route path="/returned" element={<ReturnedList />} />
            <Route path="/returned/create" element={<ReturnedCreate />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
