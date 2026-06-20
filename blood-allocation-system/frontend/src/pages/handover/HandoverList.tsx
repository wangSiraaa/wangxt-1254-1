import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  message,
  Drawer,
  Descriptions,
  Modal,
  Form,
  InputNumber,
  Alert,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, QrcodeOutlined } from '@ant-design/icons';
import { handoverApi, temperatureApi } from '../../services/api';
import type { Handover, HandoverStatus, HandoverType, HandoverItem } from '../../types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const statusMap: Record<string, any> = {
  pending: { color: 'orange', text: '待发货' },
  dispatched: { color: 'blue', text: '已发运' },
  in_transit: { color: 'geekblue', text: '运输中' },
  received: { color: 'green', text: '已接收' },
  rejected: { color: 'red', text: '已拒收' },
};

const typeMap: Record<string, any> = {
  outbound: { color: 'blue', text: '出库' },
  return: { color: 'purple', text: '退回' },
};

const HandoverList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchForm] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Handover | null>(null);
  const [tempSummary, setTempSummary] = useState<any>(null);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [receiveForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const values = searchForm.getFieldsValue();
      const res = await handoverApi.list({ ...values, page, pageSize });
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
      const d = await handoverApi.get(id);
      setDetail(d);
      const summary = await temperatureApi.getSummary(id).catch(() => null);
      setTempSummary(summary);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleDispatch = async (id: string) => {
    Modal.confirm({
      title: '发运交接单',
      content: (
        <Form layout="vertical">
          <Form.Item label="发运人" name="dispatcherName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="承运员" name="courierName">
            <Input />
          </Form.Item>
          <Form.Item label="车牌号" name="vehicleNo">
            <Input />
          </Form.Item>
        </Form>
      ),
      onOk: async (values: any) => {
        try {
          await handoverApi.dispatch(id, values);
          message.success('发运成功');
          loadData();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const openReceiveModal = (h: Handover) => {
    setDetail(h);
    const items = h.items.map((i) => ({
      ...i,
      accepted: !i.temperatureAlert,
      temperatureReceived: i.temperatureReceived,
      rejectReason: i.temperatureAlert ? '冷链温度超限' : '',
    }));
    setReceiveItems(items);
    receiveForm.resetFields();
    setReceiveModalOpen(true);
  };

  const handleBatchReceive = async () => {
    try {
      const values = await receiveForm.validateFields();
      const payload = {
        ...values,
        items: receiveItems.map((i) => ({
          handoverItemId: i.id,
          accepted: i.accepted,
          temperatureReceived: i.temperatureReceived,
          rejectReason: i.rejectReason,
        })),
      };
      await handoverApi.batchReceive(detail!.id, payload);
      message.success('接收完成');
      setReceiveModalOpen(false);
      loadData();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleReject = (id: string) => {
    Modal.confirm({
      title: '拒收交接单',
      content: (
        <Form>
          <Form.Item label="接收人" name="receiverName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="拒收原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async (values: any) => {
        try {
          await handoverApi.reject(id, values);
          message.success('已拒收');
          loadData();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleScanBag = (id: string) => {
    Modal.confirm({
      title: '扫码添加血袋',
      content: (
        <Form layout="vertical">
          <Form.Item label="血袋编号" name="bagCode" rules={[{ required: true }]}>
            <Input placeholder="扫描或输入血袋编号" prefix={<QrcodeOutlined />} />
          </Form.Item>
          <Form.Item label="当前温度(°C)" name="temperature">
            <InputNumber min={-10} max={20} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="操作人" name="operator" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      ),
      onOk: async (values: any) => {
        try {
          await handoverApi.scanBag(id, values);
          message.success('扫码添加成功');
          showDetail(id);
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
          <Input placeholder="交接单号/医院" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="status">
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: k }))}
          />
        </Form.Item>
        <Form.Item name="handoverType">
          <Select
            placeholder="类型"
            allowClear
            style={{ width: 120 }}
            options={Object.entries(typeMap).map(([k, v]) => ({ label: v.text, value: k }))}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/handover/create')}>
          新建交接单
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
            title: '交接单号',
            dataIndex: 'handoverNo',
            width: 180,
            render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
          },
          { title: '类型', dataIndex: 'handoverType', width: 80, render: (s) => <Tag color={typeMap[s]?.color}>{typeMap[s]?.text}</Tag> },
          { title: '医院', dataIndex: 'hospitalName' },
          { title: '血袋数量', dataIndex: 'items', render: (v) => v?.length || 0, width: 100 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
          },
          {
            title: '发运时间',
            dataIndex: 'dispatcherTime',
            render: (v) => (v ? dayjs(v).format('MM-DD HH:mm') : '-'),
            width: 130,
          },
          {
            title: '接收时间',
            dataIndex: 'receiveTime',
            render: (v) => (v ? dayjs(v).format('MM-DD HH:mm') : '-'),
            width: 130,
          },
          {
            title: '操作',
            key: 'action',
            width: 280,
            render: (_, r: Handover) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(r.id)}>
                  详情
                </Button>
                {r.status === 'pending' && (
                  <>
                    <Button type="link" size="small" onClick={() => handleScanBag(r.id)}>
                      扫码
                    </Button>
                    <Button type="link" size="small" onClick={() => handleDispatch(r.id)}>
                      发运
                    </Button>
                  </>
                )}
                {r.status === 'in_transit' && (
                  <>
                    <Button type="link" size="small" onClick={() => openReceiveModal(r)}>
                      逐袋接收
                    </Button>
                    <Button type="link" size="small" danger onClick={() => handleReject(r.id)}>
                      拒收
                    </Button>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title="交接单详情"
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="交接单号">{detail.handoverNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院">{detail.hospitalName}</Descriptions.Item>
              <Descriptions.Item label="冷链设备号">{detail.coldChainDeviceCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="发运人">{detail.dispatcherName || '-'}</Descriptions.Item>
              <Descriptions.Item label="承运员/车牌">
                {detail.courierName || '-'} / {detail.vehicleNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="接收人">{detail.receiverName || '-'}</Descriptions.Item>
              <Descriptions.Item label="接收医院">{detail.receiveHospitalCode || '-'}</Descriptions.Item>
            </Descriptions>

            {tempSummary && (
              <Alert
                style={{ marginTop: 12 }}
                type={tempSummary.hasOverLimit ? 'error' : 'success'}
                message={
                  tempSummary.hasOverLimit
                    ? `温度异常：检测到 ${tempSummary.alertCount} 次超限，温度范围 ${tempSummary.min}°C ~ ${tempSummary.max}°C，平均 ${tempSummary.avg}°C`
                    : `温度正常：范围 ${tempSummary.min}°C ~ ${tempSummary.max}°C，平均 ${tempSummary.avg}°C`
                }
                showIcon
              />
            )}

            <h4 style={{ marginTop: 16 }}>血袋明细</h4>
            <Table
              size="small"
              rowKey="id"
              dataSource={detail.items}
              pagination={false}
              columns={[
                { title: '血袋编号', dataIndex: 'bagCode' },
                {
                  title: '扫码时间',
                  dataIndex: 'scanTime',
                  render: (v) => (v ? dayjs(v).format('MM-DD HH:mm') : '-'),
                },
                {
                  title: '接收温度',
                  dataIndex: 'temperatureReceived',
                  render: (v) => (v ? `${v}°C` : '-'),
                },
                {
                  title: '温度状态',
                  dataIndex: 'temperatureAlert',
                  render: (v) => (v ? <Tag color="red">超限</Tag> : <Tag color="green">正常</Tag>),
                },
                {
                  title: '接收状态',
                  dataIndex: 'accepted',
                  render: (v) => (v ? <Tag color="green">已接收</Tag> : <Tag color="red">拒收</Tag>),
                },
                { title: '拒收原因', dataIndex: 'rejectReason' },
              ]}
            />
          </>
        )}
      </Drawer>

      <Modal
        title="逐袋接收确认"
        open={receiveModalOpen}
        onCancel={() => setReceiveModalOpen(false)}
        onOk={handleBatchReceive}
        width={900}
        okText="确认接收"
      >
        <Alert
          type="warning"
          showIcon
          message="请逐袋确认血袋状态，温度超限的血袋将自动拒收"
          style={{ marginBottom: 12 }}
        />
        <Form form={receiveForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receiverName" label="接收人" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hospitalCode" label="接收医院编码" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Table
          size="small"
          rowKey="id"
          dataSource={receiveItems}
          pagination={false}
          columns={[
            { title: '血袋编号', dataIndex: 'bagCode' },
            {
              title: '接收温度(°C)',
              dataIndex: 'temperatureReceived',
              render: (v, r, i) => (
                <InputNumber
                  value={receiveItems[i].temperatureReceived}
                  min={-10}
                  max={20}
                  step={0.1}
                  onChange={(val) => {
                    const newItems = [...receiveItems];
                    newItems[i].temperatureReceived = val;
                    if (val && (val < 2 || val > 6)) {
                      newItems[i].accepted = false;
                      newItems[i].rejectReason = newItems[i].rejectReason || '冷链温度超限';
                      newItems[i].temperatureAlert = true;
                    }
                    setReceiveItems(newItems);
                  }}
                />
              ),
            },
            {
              title: '温度状态',
              render: (_, r, i) =>
                receiveItems[i].temperatureAlert ? <Tag color="red">超限</Tag> : <Tag color="green">正常</Tag>,
            },
            {
              title: '是否接收',
              render: (_, r, i) => (
                <Select
                  value={receiveItems[i].accepted}
                  disabled={receiveItems[i].temperatureAlert}
                  style={{ width: 100 }}
                  onChange={(val) => {
                    const newItems = [...receiveItems];
                    newItems[i].accepted = val;
                    setReceiveItems(newItems);
                  }}
                  options={[
                    { label: '接收', value: true },
                    { label: '拒收', value: false },
                  ]}
                />
              ),
            },
            {
              title: '拒收原因',
              render: (_, r, i) => (
                <Input
                  value={receiveItems[i].rejectReason}
                  onChange={(e) => {
                    const newItems = [...receiveItems];
                    newItems[i].rejectReason = e.target.value;
                    setReceiveItems(newItems);
                  }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default HandoverList;
