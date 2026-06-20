import { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Input,
  Select,
  Button,
  DatePicker,
  Card,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { temperatureApi } from '../../services/api';
import type { TemperatureRecord, TemperatureStatus } from '../../types';
import dayjs from 'dayjs';

const statusMap: Record<string, any> = {
  normal: { color: 'green', text: '正常' },
  warning: { color: 'orange', text: '预警' },
  over_limit: { color: 'red', text: '超限' },
};

const TemperatureMonitor = () => {
  const [data, setData] = useState<TemperatureRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchForm] = Form.useForm();
  const [alertCount, setAlertCount] = useState(0);
  const [recordForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const values = searchForm.getFieldsValue();
      const params: any = { ...values, page, pageSize };
      if (values.timeRange) {
        params.startTime = values.timeRange?.[0]?.toISOString();
        params.endTime = values.timeRange?.[1]?.toISOString();
      }
      const res = await temperatureApi.list(params);
      setData(res.items);
      setTotal(res.total);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAlerts();
  }, [page, pageSize]);

  const loadAlerts = async () => {
    try {
      const alerts = await temperatureApi.alerts();
      setAlertCount(alerts.length);
    } catch (e: any) {
      // ignore
    }
  };

  const handleRecord = async () => {
    try {
      const values = await recordForm.validateFields();
      await temperatureApi.record(values);
      message.success('记录成功');
      recordForm.resetFields();
      loadData();
      loadAlerts();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleCheck = async () => {
    const temp = recordForm.getFieldValue('temperature');
    if (temp === undefined) {
      message.warning('请先输入温度');
      return;
    }
    const res = await temperatureApi.check({ temperature: temp });
    const type = res.normal ? 'success' : res.status === 'warning' ? 'warning' : 'error';
    message[type](`${res.message}，应在 ${res.min}°C ~ ${res.max}°C 范围`);
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总记录数" value={total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="超限告警" value={alertCount} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="合规范围" value="2°C ~ 6°C" />
          </Card>
        </Col>
      </Row>

      <Card title="手动记录温度" style={{ marginBottom: 16 }}>
        <Form form={recordForm} layout="inline">
          <Form.Item name="handoverId">
            <Input placeholder="交接单ID" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="bloodBagId">
            <Input placeholder="血袋ID" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="coldChainDeviceCode">
            <Input placeholder="冷链设备号" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="temperature" rules={[{ required: true, message: '请输入温度' }]}>
            <InputNumber placeholder="温度(°C)" min={-30} max={40} step={0.1} />
          </Form.Item>
          <Form.Item name="location">
            <Input placeholder="位置" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleRecord}>
                记录
              </Button>
              <Button onClick={handleCheck}>校验温度</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={loadData}>
        <Form.Item name="status">
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: k }))}
          />
        </Form.Item>
        <Form.Item name="coldChainDeviceCode">
          <Input placeholder="冷链设备号" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="timeRange">
          <DatePicker.RangePicker showTime />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={() => searchForm.resetFields()}>重置</Button>
        </Space>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: '温度(°C)',
            dataIndex: 'temperature',
            width: 120,
            render: (v, r) => (
              <span
                style={{
                  color: r.status === 'over_limit' ? '#f5222d' : r.status === 'warning' ? '#fa8c16' : '#52c41a',
                  fontWeight: r.status !== 'normal' ? 600 : undefined,
                  fontSize: 16,
                }}
              >
                {v}
              </span>
            ),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s) => {
              const cfg = statusMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
          },
          { title: '交接单ID', dataIndex: 'handoverId', width: 200, ellipsis: true },
          { title: '血袋ID', dataIndex: 'bloodBagId', width: 200, ellipsis: true },
          { title: '冷链设备', dataIndex: 'coldChainDeviceCode' },
          { title: '位置', dataIndex: 'location' },
          {
            title: '记录时间',
            dataIndex: 'recordTime',
            width: 170,
            render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
          },
        ]}
      />
    </div>
  );
};

export default TemperatureMonitor;
