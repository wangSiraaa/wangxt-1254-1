import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  InputNumber,
  message,
  Divider,
  Table,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, MinusOutlined, QrcodeOutlined } from '@ant-design/icons';
import { handoverApi, bloodBagApi } from '../../services/api';
import type { HandoverType } from '../../types';
import { useNavigate } from 'react-router-dom';

const HandoverCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scannedBags, setScannedBags] = useState<any[]>([]);
  const [scanForm] = Form.useForm();

  const handleScan = async () => {
    try {
      const values = await scanForm.validateFields();
      const bag = await bloodBagApi.getByCode(values.bagCode);
      const exists = scannedBags.find((b) => b.bagCode === values.bagCode);
      if (exists) {
        message.warning('该血袋已扫码');
        return;
      }
      setScannedBags([
        ...scannedBags,
        {
          ...bag,
          scanTemperature: values.temperature,
        },
      ]);
      scanForm.resetFields();
      message.success('扫码成功');
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const removeScanned = (index: number) => {
    const newList = [...scannedBags];
    newList.splice(index, 1);
    setScannedBags(newList);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (scannedBags.length === 0) {
        message.warning('请先扫码添加血袋');
        return;
      }
      setLoading(true);
      const payload = {
        ...values,
        scannedBags: scannedBags.map((b) => ({
          bagCode: b.bagCode,
          temperatureReceived: b.scanTemperature,
        })),
      };
      await handoverApi.create(payload);
      message.success('交接单创建成功');
      navigate('/handover');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/handover')}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>新建冷链交接单</span>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="handoverType"
                label="交接类型"
                rules={[{ required: true }]}
                initialValue="outbound"
              >
                <Select
                  options={[
                    { label: '出库', value: 'outbound' as HandoverType },
                    { label: '退回', value: 'return' as HandoverType },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="appointmentId" label="关联预约单ID">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hospitalCode"
                label="医院编码"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hospitalName"
                label="医院名称"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="coldChainDeviceCode" label="冷链设备编号">
                <Input placeholder="冷藏箱/冷链车编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="courierName" label="承运员">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicleNo" label="车牌号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="扫码添加血袋">
        <Form form={scanForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="bagCode" rules={[{ required: true, message: '请输入血袋编号' }]}>
            <Input placeholder="血袋编号" prefix={<QrcodeOutlined />} style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="temperature">
            <InputNumber placeholder="出库温度(°C)" min={-10} max={20} step={0.1} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleScan}>
                扫码添加
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          size="small"
          rowKey="id"
          dataSource={scannedBags}
          pagination={false}
          columns={[
            { title: '血袋编号', dataIndex: 'bagCode' },
            { title: '血型', dataIndex: 'bloodType' },
            { title: '成分', dataIndex: 'componentType' },
            { title: '批号', dataIndex: 'batchNo' },
            {
              title: '扫描温度(°C)',
              dataIndex: 'scanTemperature',
              render: (v) => v || '-',
            },
            {
              title: '效期',
              dataIndex: 'expireDate',
              render: (v) => new Date(v).toLocaleDateString(),
            },
            {
              title: '操作',
              render: (_, __, i) => (
                <Button type="link" danger size="small" icon={<MinusOutlined />} onClick={() => removeScanned(i)}>
                  移除
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Divider />

      <Space>
        <Button type="primary" loading={loading} onClick={handleSubmit}>
          创建交接单
        </Button>
        <Button onClick={() => navigate('/handover')}>取消</Button>
      </Space>
    </div>
  );
};

export default HandoverCreate;
