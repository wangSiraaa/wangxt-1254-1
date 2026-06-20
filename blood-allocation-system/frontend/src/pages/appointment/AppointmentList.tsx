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
  Drawer,
  Descriptions,
  Popconfirm,
  Row,
  Col,
  InputNumber,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { appointmentApi } from '../../services/api';
import type { Appointment, AppointmentStatus, UrgencyLevel, BloodType, BloodComponentType } from '../../types';
import dayjs from 'dayjs';
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

const statusMap: Record<string, any> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'blue', text: '已审核' },
  allocating: { color: 'gold', text: '分配中' },
  allocated: { color: 'cyan', text: '已分配' },
  cross_matching: { color: 'purple', text: '配血中' },
  cross_match_confirmed: { color: 'green', text: '配血确认' },
  cross_match_failed: { color: 'red', text: '配血失败' },
  ready_for_delivery: { color: 'geekblue', text: '待发货' },
  in_transit: { color: 'blue', text: '运输中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
  rejected: { color: 'red', text: '已驳回' },
};

const urgencyMap: Record<string, any> = {
  normal: { color: 'default', text: '普通' },
  urgent: { color: 'orange', text: '紧急' },
  emergency: { color: 'red', text: '急诊' },
};

const AppointmentList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchForm] = Form.useForm();
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const values = searchForm.getFieldsValue();
      const res = await appointmentApi.list({ ...values, page, pageSize });
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

  const handleApprove = async (id: string) => {
    try {
      await appointmentApi.approve(id, { operator: 'admin' });
      message.success('审批通过');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleReject = async (id: string) => {
    Modal.confirm({
      title: '驳回预约',
      content: (
        <Form>
          <Form.Item label="驳回原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          await appointmentApi.reject(id, { reason: '驳回', operator: 'admin' });
          message.success('已驳回');
          loadData();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleAllocate = async (id: string) => {
    try {
      await appointmentApi.allocate(id);
      message.success('分配成功（临近效期血袋已优先分配）');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleConfirmCrossMatch = async (id: string) => {
    try {
      await appointmentApi.confirmCrossMatch(id);
      message.success('交叉配血已确认');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      await appointmentApi.markReady(id);
      message.success('已标记待发货');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentApi.cancel(id);
      message.success('已取消');
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const showDetail = async (id: string) => {
    try {
      const d = await appointmentApi.get(id);
      setDetail(d);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  return (
    <div>
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={loadData}>
        <Form.Item name="keyword">
          <Input placeholder="预约单号/医院" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="status">
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: k }))}
          />
        </Form.Item>
        <Form.Item name="urgencyLevel">
          <Select
            placeholder="紧急程度"
            allowClear
            style={{ width: 120 }}
            options={Object.entries(urgencyMap).map(([k, v]) => ({ label: v.text, value: k }))}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/appointment/create')}>
          新建预约
        </Button>
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
          { title: '预约单号', dataIndex: 'appointmentNo', width: 180, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
          { title: '医院', dataIndex: 'hospitalName' },
          { title: '患者', dataIndex: 'patientName' },
          {
            title: '紧急程度',
            dataIndex: 'urgencyLevel',
            width: 100,
            render: (s) => {
              const cfg = urgencyMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
          },
          {
            title: '用血时间',
            dataIndex: 'expectedUseDate',
            render: (v) => dayjs(v).format('YYYY-MM-DD'),
            width: 110,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (s) => {
              const cfg = statusMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (v) => dayjs(v).format('MM-DD HH:mm'),
            width: 120,
          },
          {
            title: '操作',
            key: 'action',
            width: 320,
            render: (_, r: Appointment) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(r.id)}>
                  详情
                </Button>
                {r.status === 'pending' && (
                  <>
                    <Button type="link" size="small" onClick={() => handleApprove(r.id)}>
                      审批
                    </Button>
                    <Button type="link" size="small" danger onClick={() => handleReject(r.id)}>
                      驳回
                    </Button>
                  </>
                )}
                {(r.status === 'approved') && (
                  <Button type="link" size="small" onClick={() => handleAllocate(r.id)}>
                    分配血袋
                  </Button>
                )}
                {r.status === 'cross_matching' && (
                  <Button type="link" size="small" onClick={() => handleConfirmCrossMatch(r.id)}>
                    确认配血
                  </Button>
                )}
                {(r.status === 'cross_match_confirmed' || r.status === 'allocated') && (
                  <Popconfirm
                    title={r.crossMatchRequired ? '交叉配血确认后才能出库，确认操作？' : '确认标记待发货？'}
                    onConfirm={() => handleMarkReady(r.id)}
                  >
                    <Button type="link" size="small">
                      待发货
                    </Button>
                  </Popconfirm>
                )}
                {['pending', 'approved', 'allocated', 'cross_matching', 'cross_match_confirmed', 'ready_for_delivery'].includes(
                  r.status,
                ) && (
                  <Popconfirm title="确认取消该预约？" onConfirm={() => handleCancel(r.id)}>
                    <Button type="link" size="small" danger>
                      取消
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title="预约详情"
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="预约单号">{detail.appointmentNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院">{detail.hospitalName}</Descriptions.Item>
              <Descriptions.Item label="科室">{detail.department}</Descriptions.Item>
              <Descriptions.Item label="主治医生">{detail.doctorName}</Descriptions.Item>
              <Descriptions.Item label="患者">{detail.patientName}</Descriptions.Item>
              <Descriptions.Item label="紧急程度">
                <Tag color={urgencyMap[detail.urgencyLevel]?.color}>{urgencyMap[detail.urgencyLevel]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预计用血时间">
                {dayjs(detail.expectedUseDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="需交叉配血">{detail.crossMatchRequired ? '是' : '否'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="诊断" span={2}>
                {detail.diagnosis}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.remark}
              </Descriptions.Item>
            </Descriptions>
            <h4 style={{ marginTop: 16 }}>用血明细</h4>
            <Table
              size="small"
              rowKey="id"
              dataSource={detail.items}
              pagination={false}
              columns={[
                { title: '血型', dataIndex: 'bloodType' },
                { title: '成分', dataIndex: 'componentType' },
                { title: '申请数量', dataIndex: 'quantity' },
                { title: '已分配', dataIndex: 'allocatedQuantity' },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default AppointmentList;
