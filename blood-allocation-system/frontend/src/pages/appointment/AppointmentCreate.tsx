import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Space,
  InputNumber,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, MinusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { appointmentApi } from '../../services/api';
import type { BloodType, BloodComponentType, UrgencyLevel } from '../../types';
import { useNavigate } from 'react-router-dom';

const BloodTypeOptions: { label: string; value: BloodType }[] = [
  { label: 'A+', value: 'A+' as BloodType },
  { label: 'A-', value: 'A-' as BloodType },
  { label: 'B+', value: 'B+' as BloodType },
  { label: 'B-', value: 'B-' as BloodType },
  { label: 'AB+', value: 'AB+' as BloodType },
  { label: 'AB-', value: 'AB-' as BloodType },
  { label: 'O+', value: 'O+' as BloodType },
  { label: 'O-', value: 'O-' as BloodType },
];

const ComponentTypeOptions: { label: string; value: BloodComponentType }[] = [
  { label: '红细胞', value: '红细胞' as BloodComponentType },
  { label: '血浆', value: '血浆' as BloodComponentType },
  { label: '血小板', value: '血小板' as BloodComponentType },
  { label: '冷沉淀', value: '冷沉淀' as BloodComponentType },
  { label: '全血', value: '全血' as BloodComponentType },
  { label: '白细胞', value: '白细胞' as BloodComponentType },
];

const UrgencyOptions: { label: string; value: UrgencyLevel }[] = [
  { label: '普通', value: 'normal' as UrgencyLevel },
  { label: '紧急', value: 'urgent' as UrgencyLevel },
  { label: '急诊', value: 'emergency' as UrgencyLevel },
];

const AppointmentCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        expectedUseDate: values.expectedUseDate?.toISOString(),
      };
      await appointmentApi.create(payload);
      message.success('预约提交成功');
      navigate('/appointment');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/appointment')}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>新建用血预约</span>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hospitalCode"
                label="医院编码"
                rules={[{ required: true, message: '请输入医院编码' }]}
              >
                <Input placeholder="如：H001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hospitalName"
                label="医院名称"
                rules={[{ required: true, message: '请输入医院名称' }]}
              >
                <Input placeholder="如：XX市中心医院" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="科室">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="doctorName" label="主治医生">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="urgencyLevel"
                label="紧急程度"
                rules={[{ required: true, message: '请选择紧急程度' }]}
                initialValue="normal"
              >
                <Select options={UrgencyOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientName" label="患者姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientId" label="患者ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expectedUseDate"
                label="预计用血时间"
                rules={[{ required: true, message: '请选择预计用血时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="crossMatchRequired" label="是否需要交叉配血" initialValue={true}>
                <Select
                  options={[
                    { label: '需要', value: true },
                    { label: '不需要', value: false },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="diagnosis" label="临床诊断">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">用血明细</Divider>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('请至少添加一条用血明细'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'bloodType']}
                      rules={[{ required: true, message: '请选择血型' }]}
                      style={{ width: 120 }}
                    >
                      <Select placeholder="血型" options={BloodTypeOptions} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'componentType']}
                      rules={[{ required: true, message: '请选择成分' }]}
                      style={{ width: 140 }}
                    >
                      <Select placeholder="成分类型" options={ComponentTypeOptions} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ width: 120 }}
                    >
                      <InputNumber placeholder="数量(袋)" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'volumePerUnit']} style={{ width: 120 }}>
                      <InputNumber placeholder="单袋容量(ml)" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'remark']} style={{ width: 200 }}>
                      <Input placeholder="备注" />
                    </Form.Item>
                    <MinusOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加用血明细
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Space>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              提交预约
            </Button>
            <Button onClick={() => navigate('/appointment')}>取消</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default AppointmentCreate;
