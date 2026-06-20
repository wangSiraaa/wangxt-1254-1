import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Alert, Spin } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  WarningOutlined,
  CarryOutOutlined,
} from '@ant-design/icons';
import { bloodBagApi, appointmentApi, temperatureApi } from '../services/api';
import type { BloodBag, TemperatureRecord } from '../types';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [expiringBags, setExpiringBags] = useState<BloodBag[]>([]);
  const [alerts, setAlerts] = useState<TemperatureRecord[]>([]);
  const [pendingAppts, setPendingAppts] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, expiringRes, alertsRes, apptsRes] = await Promise.all([
        bloodBagApi.stats().catch(() => []),
        bloodBagApi.expiring().catch(() => []),
        temperatureApi.alerts().catch(() => []),
        appointmentApi.list({ status: 'pending', pageSize: 1 }).catch(() => ({ total: 0 })),
      ]);
      setStats(statsRes);
      setExpiringBags(expiringRes);
      setAlerts(alertsRes);
      setPendingAppts((apptsRes as any).total || 0);
    } finally {
      setLoading(false);
    }
  };

  const totalInStock = Array.isArray(stats)
    ? stats.filter((s: any) => s.status === 'in_stock').reduce((sum: number, s: any) => sum + Number(s.count), 0)
    : 0;

  const statusTag = (status: string) => {
    const map: Record<string, any> = {
      in_stock: { color: 'green', text: '在库' },
      preempted: { color: 'orange', text: '预占' },
      in_transit: { color: 'blue', text: '运输中' },
      expired: { color: 'red', text: '过期' },
    };
    const cfg = map[status] || { color: 'default', text: status };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  return (
    <Spin spinning={loading}>
      {alerts.length > 0 && (
        <Alert
          message={`温度告警：当前有 ${alerts.length} 条温度超限记录，请及时处理`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {expiringBags.length > 0 && (
        <Alert
          message={`效期预警：当前有 ${expiringBags.length} 袋血临近效期，请优先出库`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在库血袋数"
              value={totalInStock}
              prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核预约"
              value={pendingAppts}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="临近效期血袋"
              value={expiringBags.length}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: expiringBags.length > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="温度超限告警"
              value={alerts.length}
              prefix={<CarryOutOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: alerts.length > 0 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="临近效期血袋（效期优先）">
            <Table
              rowKey="id"
              dataSource={expiringBags}
              pagination={false}
              size="small"
              columns={[
                { title: '血袋编号', dataIndex: 'bagCode' },
                { title: '血型', dataIndex: 'bloodType' },
                { title: '成分', dataIndex: 'componentType' },
                {
                  title: '失效日期',
                  dataIndex: 'expireDate',
                  render: (v) => dayjs(v).format('YYYY-MM-DD'),
                },
                { title: '状态', dataIndex: 'status', render: statusTag },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最新温度超限记录">
            <Table
              rowKey="id"
              dataSource={alerts}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '温度(°C)',
                  dataIndex: 'temperature',
                  render: (v) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{v}</span>,
                },
                {
                  title: '记录时间',
                  dataIndex: 'recordTime',
                  render: (v) => dayjs(v).format('MM-DD HH:mm'),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: () => <Tag color="red">超限</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default Dashboard;
