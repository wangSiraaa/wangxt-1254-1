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
  DatePicker,
  Row,
  Col,
  Switch,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { returnedApi, bloodBagApi } from '../../services/api';
import type { ReturnReason } from '../../types';
import { useNavigate } from 'react-router-dom';

const reasonOptions: { label: string; value: ReturnReason }[] = [
  { label: '未使用', value: 'not_used' as ReturnReason },
  { label: '已过期', value: 'expired' as ReturnReason },
  { label: '包装破损', value: 'broken' as ReturnReason },
  { label: '型号错误', value: 'wrong_type' as ReturnReason },
  { label: '质量问题', value: 'quality_issue' as ReturnReason },
  { label: '其他', value: 'other' as ReturnReason },
];

const ReturnedCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [bagInfo, setBagInfo] = useState<any>(null);

  const loadBagInfo = async (bagCode: string) => {
    if (!bagCode) {
      setBagInfo(null);
      return;
    }
    try {
      const bag = await bloodBagApi.getByCode(bagCode);
      setBagInfo(bag);
      form.setFieldsValue({ bloodBagId: bag.id });
    } catch (e: any) {
      message.error('未找到该血袋');
      setBagInfo(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!bagInfo) {
        message.error('请先输入有效血袋编号');
        return;
      }
      setLoading(true);
      const payload = {
        ...values,
        returnTime: values.returnTime?.toISOString(),
      };
      await returnedApi.create(payload);
      message.success('登记成功');
      navigate('/returned');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/returned')}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>登记退回血</span>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="bagCode"
                label="血袋编号"
                rules={[{ required: true, message: '请输入血袋编号' }]}
              >
                <Input
                  placeholder="扫描或输入血袋编号"
                  onBlur={(e) => loadBagInfo(e.target.value)}
                  onPressEnter={(e) => loadBagInfo((e.target as HTMLInputElement).value)}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              {bagInfo && (
                <Card size="small" type="inner" title="血袋信息">
                  <Space>
                    <span>血型：<b>{bagInfo.bloodType}</b></span>
                    <span>成分：<b>{bagInfo.componentType}</b></span>
                    <span>批号：<b>{bagInfo.batchNo}</b></span>
                    <span>容量：<b>{bagInfo.volume}ml</b></span>
                    <span>
                      效期：<b>{new Date(bagInfo.expireDate).toLocaleDateString()}</b>
                    </span>
                  </Space>
                </Card>
              )}
            </Col>
            <Col span={8} style={{ display: 'none' }}>
              <Form.Item name="bloodBagId" label="血袋ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={8}>
              <Form.Item
                name="reason"
                label="退回原因"
                rules={[{ required: true }]}
                initialValue="not_used"
              >
                <Select options={reasonOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="returnTime"
                label="退回时间"
                rules={[{ required: true }]}
                initialValue={() => null}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="returnOperator"
                label="退回操作人"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="returnTemperature" label="退回温度(°C)">
                <InputNumber min={-10} max={20} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="packageIntact" label="包装完好" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="appointmentId" label="关联预约单ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="handoverId" label="关联交接单ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              提交登记
            </Button>
            <Button onClick={() => navigate('/returned')}>取消</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ReturnedCreate;
