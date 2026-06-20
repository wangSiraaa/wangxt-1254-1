import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { bloodBagApi } from '../../services/api';
import type { BloodBag, BloodType, BloodComponentType, BloodBagStatus } from '../../types';
import dayjs from 'dayjs';

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

const statusMap: Record<string, any> = {
  in_stock: { color: 'green', text: '在库' },
  preempted: { color: 'orange', text: '预占' },
  allocated: { color: 'gold', text: '已分配' },
  in_transit: { color: 'blue', text: '运输中' },
  received: { color: 'cyan', text: '已接收' },
  returned: { color: 'purple', text: '已退回' },
  used: { color: 'default', text: '已使用' },
  expired: { color: 'red', text: '已过期' },
  discarded: { color: 'red', text: '已报废' },
};

const BloodBagList = () => {
  const [data, setData] = useState<BloodBag[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const values = searchForm.getFieldsValue();
      const res = await bloodBagApi.list({ ...values, page, pageSize });
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
  }, [page, pageSize]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await bloodBagApi.create({
        ...values,
        collectDate: values.collectDate?.toISOString(),
        expireDate: values.expireDate?.toISOString(),
      });
      message.success('入库成功');
      setModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bloodBagApi.remove(id);
      message.success('删除成功');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleCheckExpired = async () => {
    try {
      const res = await bloodBagApi.checkExpired();
      message.success(`已标记过期血袋 ${res.count} 袋`);
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const isExpiringSoon = (expireDate: string) => {
    const diff = dayjs(expireDate).diff(dayjs(), 'day');
    return diff >= 0 && diff <= 7;
  };

  return (
    <div>
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={loadData}>
        <Form.Item name="keyword">
          <Input placeholder="血袋编号/批号" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="bloodType">
          <Select placeholder="血型" allowClear style={{ width: 120 }} options={BloodTypeOptions} />
        </Form.Item>
        <Form.Item name="componentType">
          <Select placeholder="成分类型" allowClear style={{ width: 120 }} options={ComponentTypeOptions} />
        </Form.Item>
        <Form.Item name="status">
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: k }))}
          />
        </Form.Item>
        <Form.Item name="expiringSoon" valuePropName="checked">
          <Select
            placeholder="临近效期"
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '是', value: true },
              { label: '否', value: false },
            ]}
          />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={() => searchForm.resetFields()}>重置</Button>
        </Space>
      </Form>

      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            血袋入库
          </Button>
          <Button onClick={handleCheckExpired}>检查过期</Button>
        </Space>
        <span style={{ color: '#666' }}>共 {total} 条记录</span>
      </Row>

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
            title: '血袋编号',
            dataIndex: 'bagCode',
            render: (v, r) => (
              <Space>
                <span style={{ fontWeight: 600 }}>{v}</span>
                {isExpiringSoon(r.expireDate) && <Tag color="orange">临近效期</Tag>}
                {r.temperatureAlert && <Tag color="red">温度异常</Tag>}
                {r.crossMatchConfirmed && <Tag color="green">配血确认</Tag>}
              </Space>
            ),
          },
          { title: '血型', dataIndex: 'bloodType', width: 80 },
          { title: '成分类型', dataIndex: 'componentType', width: 100 },
          { title: '容量(ml)', dataIndex: 'volume', width: 90 },
          { title: '批号', dataIndex: 'batchNo' },
          {
            title: '采集日期',
            dataIndex: 'collectDate',
            render: (v) => dayjs(v).format('YYYY-MM-DD'),
            width: 110,
          },
          {
            title: '失效日期',
            dataIndex: 'expireDate',
            render: (v) => (
              <span style={{ color: isExpiringSoon(v) ? '#fa8c16' : undefined, fontWeight: isExpiringSoon(v) ? 600 : undefined }}>
                {dayjs(v).format('YYYY-MM-DD')}
              </span>
            ),
            width: 110,
          },
          { title: '存储位置', dataIndex: 'storageLocation' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (s) => {
              const cfg = statusMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
            width: 100,
          },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, r) => (
              <Space>
                <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" danger size="small">
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="血袋入库"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        width={700}
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bagCode"
                label="血袋编号"
                rules={[{ required: true, message: '请输入血袋编号' }]}
              >
                <Input placeholder="扫描或输入血袋编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="batchNo"
                label="批号"
                rules={[{ required: true, message: '请输入批号' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="bloodType"
                label="血型"
                rules={[{ required: true, message: '请选择血型' }]}
              >
                <Select options={BloodTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="componentType"
                label="成分类型"
                rules={[{ required: true, message: '请选择成分类型' }]}
              >
                <Select options={ComponentTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="volume"
                label="容量(ml)"
                rules={[{ required: true, message: '请输入容量' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="collectDate"
                label="采集日期"
                rules={[{ required: true, message: '请选择采集日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expireDate"
                label="失效日期"
                rules={[{ required: true, message: '请选择失效日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="collectStation" label="采集站点">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="donorCode" label="献血者编号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="storageLocation" label="存储位置">
                <Input placeholder="如：冷藏柜A-01" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BloodBagList;
