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
  message,
  Drawer,
  Descriptions,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { returnedApi } from '../../services/api';
import type { ReturnedBlood, ReturnedStatus, ReturnReason } from '../../types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const statusMap: Record<string, any> = {
  pending: { color: 'orange', text: '待处理' },
  inspecting: { color: 'blue', text: '复检中' },
  re_inventory: { color: 'green', text: '重新入库' },
  discarded: { color: 'red', text: '已报废' },
};

const reasonMap: Record<string, any> = {
  expired: { color: 'red', text: '已过期' },
  broken: { color: 'orange', text: '破损' },
  wrong_type: { color: 'purple', text: '型号错误' },
  not_used: { color: 'blue', text: '未使用' },
  quality_issue: { color: 'red', text: '质量问题' },
  other: { color: 'default', text: '其他' },
};

const ReturnedList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ReturnedBlood[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchForm] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ReturnedBlood | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const values = searchForm.getFieldsValue();
      const res = await returnedApi.list({ ...values, page, pageSize });
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

  const showDetail = async (id: string) => {
    try {
      const d = await returnedApi.get(id);
      setDetail(d);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const openInspect = (item: ReturnedBlood) => {
    setDetail(item);
    inspectForm.resetFields();
    setInspectModalOpen(true);
  };

  const handleInspect = async () => {
    try {
      const values = await inspectForm.validateFields();
      await returnedApi.inspect(detail!.id, { ...values, operator: 'admin' });
      message.success('复检完成');
      setInspectModalOpen(false);
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleReInventory = async (id: string) => {
    Modal.confirm({
      title: '确认重新入库',
      content: '确认该血袋复检合格，可以重新入库？',
      onOk: async () => {
        try {
          await returnedApi.reInventory(id, 'admin');
          message.success('重新入库成功');
          loadData();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleDiscard = async (id: string) => {
    Modal.confirm({
      title: '报废处理',
      content: (
        <Form>
          <Form.Item label="报废原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async (values: any) => {
        try {
          await returnedApi.discard(id, 'admin', values.reason);
          message.success('报废成功');
          loadData();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  return (
    <div>
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={loadData}>
        <Form.Item name="keyword">
          <Input placeholder="退回单号/血袋编号/医院" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="status">
          <Select
            placeholder="处理状态"
            allowClear
            style={{ width: 140 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: k }))}
          />
        </Form.Item>
        <Form.Item name="reason">
          <Select
            placeholder="退回原因"
            allowClear
            style={{ width: 140 }}
            options={Object.entries(reasonMap).map(([k, v]) => ({ label: v.text, value: k }))}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/returned/create')}>
          登记退回血
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
          {
            title: '退回单号',
            dataIndex: 'returnNo',
            width: 180,
            render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
          },
          { title: '血袋编号', dataIndex: 'bagCode', width: 150 },
          { title: '医院', dataIndex: 'hospitalName' },
          {
            title: '退回原因',
            dataIndex: 'reason',
            width: 110,
            render: (s) => {
              const cfg = reasonMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
          },
          {
            title: '处理状态',
            dataIndex: 'status',
            width: 110,
            render: (s) => {
              const cfg = statusMap[s] || { color: 'default', text: s };
              return <Tag color={cfg.color}>{cfg.text}</Tag>;
            },
          },
          {
            title: '包装完好',
            dataIndex: 'packageIntact',
            width: 100,
            render: (v) => (v ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>),
          },
          {
            title: '退回时间',
            dataIndex: 'returnTime',
            width: 160,
            render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
          },
          {
            title: '操作',
            key: 'action',
            width: 220,
            render: (_, r: ReturnedBlood) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(r.id)}>
                  详情
                </Button>
                {r.status === 'pending' && (
                  <>
                    <Button type="link" size="small" onClick={() => openInspect(r)}>
                      复检
                    </Button>
                    <Button type="link" size="small" onClick={() => handleReInventory(r.id)}>
                      重新入库
                    </Button>
                    <Button type="link" size="small" danger onClick={() => handleDiscard(r.id)}>
                      报废
                    </Button>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer title="退回血详情" width={600} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="退回单号">{detail.returnNo}</Descriptions.Item>
              <Descriptions.Item label="处理状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="血袋编号">{detail.bagCode}</Descriptions.Item>
              <Descriptions.Item label="退回原因">
                <Tag color={reasonMap[detail.reason]?.color}>{reasonMap[detail.reason]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院">{detail.hospitalName}</Descriptions.Item>
              <Descriptions.Item label="退回操作人">{detail.returnOperator}</Descriptions.Item>
              <Descriptions.Item label="退回温度">
                {detail.returnTemperature !== undefined ? `${detail.returnTemperature}°C` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="包装完好">
                {detail.packageIntact ? '是' : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="退回时间" span={2}>
                {dayjs(detail.returnTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="复检结果" span={2}>
                {detail.inspectionResult || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="复检操作人">
                {detail.inspectionOperator || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="复检时间">
                {detail.inspectionTime ? dayjs(detail.inspectionTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.remark}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>

      <Modal
        title="质量复检"
        open={inspectModalOpen}
        onOk={handleInspect}
        onCancel={() => setInspectModalOpen(false)}
      >
        <Form form={inspectForm} layout="vertical">
          <Form.Item name="inspectionResult" label="复检结果" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细描述复检结果..." />
          </Form.Item>
          <Form.Item name="finalStatus" label="处理结论" rules={[{ required: true }]} initialValue="re_inventory">
            <Select
              options={[
                { label: '重新入库', value: 're_inventory' as ReturnedStatus },
                { label: '报废', value: 'discarded' as ReturnedStatus },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReturnedList;
