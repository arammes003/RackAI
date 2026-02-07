import React from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Home, 
  Users, 
  ContactRound, 
  Receipt, 
  User, 
  Calendar, 
  HelpCircle, 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Map as MapIcon, 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  Download,
  Mail,
  UserPlus,
  TrafficCone
} from 'lucide-react';
import '../styles/NewDashboard.css';
import profilImg from '/public/vite.svg'; // Using the image itself as profile placeholder if no other image, or just a placeholder div

// Mock Data matching the image
const recentTransactions = [
  { txId: '01e4dsa', user: 'johndoe', date: '2021-09-01', cost: '43.95' },
  { txId: '0315dsaa', user: 'jackdower', date: '2022-04-01', cost: '133.45' },
  { txId: '01e4dsa', user: 'aberdohnny', date: '2021-09-01', cost: '43.95' },
  { txId: '51034szv', user: 'goodmanave', date: '2022-11-05', cost: '200.95' },
  { txId: '01e4dsa', user: 'stevebower', date: '2022-11-02', cost: '14.95' },
  { txId: '01e4dsa', user: 'aberdohnny', date: '2021-09-01', cost: '43.95' },
  { txId: '120s51a', user: 'wootzifer', date: '2019-04-15', cost: '24.20' },
  { txId: '0315dsaa', user: 'jackdower', date: '2022-04-01', cost: '133.45' },
];

const NewDashboard = () => {
    
  // Chart Configs
  const revenueOption = {
    color: ['#6870fa', '#4cceac', '#a4a9fc'],
    tooltip: { trigger: 'axis' },
    legend: { 
        data: ['revenue', 'profit', 'expenses'], // Guessing series names
        textStyle: { color: '#ffffff' },
        bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: ['plane', 'helicopter', 'boat', 'train', 'subway', 'bus', 'car', 'moto', 'bicycle', 'horse', 'skateboard', 'others'],
        axisLabel: { color: '#a3a3a3' }
    },
    yAxis: { 
        type: 'value',
        axisLabel: { color: '#a3a3a3' },
        splitLine: { show: false }
    },
    series: [
      { name: 'revenue', type: 'line', smooth: true, data: [200, 250, 180, 290, 200, 390, 280, 420, 350, 310, 280, 240] },
      { name: 'profit', type: 'line', smooth: true, data: [100, 130, 90, 150, 110, 200, 150, 230, 180, 160, 140, 120] },
      { name: 'expenses', type: 'line', smooth: true, data: [310, 220, 190, 240, 150, 90, 110, 190, 290, 350, 270, 210] }
    ]
  };

  const campaignOption = {
    color: ['#4cceac', '#6870fa', '#db4f4a'], // Matching colors
    tooltip: { trigger: 'item' },
    legend: { show: false },
    series: [
      {
        name: 'Campaign',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
        ]
      }
    ]
  };

  const salesOption = {
    color: ['#6870fa', '#4cceac', '#db4f4a', '#a4a9fc'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: [
      {
        type: 'category',
        data: ['AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM'],
        axisTick: { alignWithLabel: true },
        axisLabel: { color: '#a3a3a3' }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#a3a3a3' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Direct',
        type: 'bar',
        barWidth: '60%',
        stack: 'total',
        data: [320, 332, 301, 334, 390, 330, 320]
      },
       {
        name: 'Affiliate',
        type: 'bar',
        stack: 'total',
        data: [120, 132, 101, 134, 90, 230, 210]
      },
       {
        name: 'Sponsored',
        type: 'bar',
        stack: 'total',
        data: [220, 182, 191, 234, 290, 330, 310]
      }
    ]
  };

  return (
    <div className="nd-container">
      {/* Sidebar */}
      <div className="nd-sidebar">
        <div className="nd-sidebar-header">
          <div className="nd-logo">ADMINIS</div>
          <div style={{marginLeft: 'auto'}}><Menu size={20}/></div>
        </div>
        
        <div className="nd-profile">
            {/* Placeholder for Ed Roh image */}
            <div className="nd-profile-img" style={{backgroundColor: '#ccc'}}></div> 
            <div className="nd-profile-name">Ed Roh</div>
            <div className="nd-profile-role">VP Fancy Admin</div>
        </div>

        <div className="nd-menu-group">Dashboard</div>
        <div className="nd-menu-item active"><Home className="nd-menu-icon" /> Dashboard</div>

        <div className="nd-menu-group">Data</div>
        <div className="nd-menu-item"><Users className="nd-menu-icon" /> Manage Team</div>
        <div className="nd-menu-item"><ContactRound className="nd-menu-icon" /> Contacts Information</div>
        <div className="nd-menu-item"><Receipt className="nd-menu-icon" /> Invoices Balances</div>

        <div className="nd-menu-group">Pages</div>
        <div className="nd-menu-item"><User className="nd-menu-icon" /> Profile Form</div>
        <div className="nd-menu-item"><Calendar className="nd-menu-icon" /> Calendar</div>
        <div className="nd-menu-item"><HelpCircle className="nd-menu-icon" /> FAQ Page</div>

        <div className="nd-menu-group">Charts</div>
        <div className="nd-menu-item"><BarChart className="nd-menu-icon" /> Bar Chart</div>
        <div className="nd-menu-item"><PieChart className="nd-menu-icon" /> Pie Chart</div>
        <div className="nd-menu-item"><TrendingUp className="nd-menu-icon" /> Line Chart</div>
        <div className="nd-menu-item"><MapIcon className="nd-menu-icon" /> Geography Chart</div>
      </div>

      {/* Main Content */}
      <main className="nd-main">
        <div className="nd-header">
            <div className="nd-search-bar">
                <input type="text" placeholder="Search" className="nd-search-input" />
                <Search size={16} />
            </div>
            <div className="nd-header-icons">
                <div className="nd-header-icon"><MapIcon size={20} /></div> {/* Use simplified icons for header */}
                <div className="nd-header-icon"><Bell size={20} /></div>
                <div className="nd-header-icon"><Settings size={20} /></div>
                <div className="nd-header-icon"><User size={20} /></div>
            </div>
        </div>

        <div className="nd-content">
            <div className="nd-page-header">
                <div>
                    <div className="nd-title">DASHBOARD</div>
                    <div className="nd-subtitle">Welcome to your dashboard</div>
                </div>
                <button className="nd-btn-download">
                    <Download size={18} /> DOWNLOAD REPORTS
                </button>
            </div>

            <div className="nd-grid">
                {/* Row 1 - Stats */}
                <div className="nd-stat-box">
                    <Mail size={30} color="#4cceac" style={{marginRight: 20}} /> 
                    <div>
                        <div className="nd-text-h3">12,361</div>
                        <div className="nd-text-h5">Emails Sent</div>
                    </div>
                    <div style={{marginLeft: 'auto', fontStyle: 'italic', color: '#4cceac'}}>+14%</div>
                </div>
                <div className="nd-stat-box">
                    <TrafficCone size={30} color="#4cceac" style={{marginRight: 20}} /> 
                    <div>
                        <div className="nd-text-h3">431,225</div>
                        <div className="nd-text-h5">Sales Obtained</div>
                    </div>
                     <div style={{marginLeft: 'auto', fontStyle: 'italic', color: '#4cceac'}}>+21%</div>
                </div>
                <div className="nd-stat-box">
                    <UserPlus size={30} color="#4cceac" style={{marginRight: 20}} /> 
                    <div>
                        <div className="nd-text-h3">32,441</div>
                        <div className="nd-text-h5">New Clients</div>
                    </div>
                     <div style={{marginLeft: 'auto', fontStyle: 'italic', color: '#4cceac'}}>+5%</div>
                </div>
                <div className="nd-stat-box">
                    <TrafficCone size={30} color="#4cceac" style={{marginRight: 20}} /> 
                    <div>
                        <div className="nd-text-h3">1,325,134</div>
                        <div className="nd-text-h5">Traffic Received</div>
                    </div>
                     <div style={{marginLeft: 'auto', fontStyle: 'italic', color: '#4cceac'}}>+43%</div>
                </div>

                {/* Row 2 - Revenue & Transactions */}
                <div className="nd-row-2">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <div>
                            <div className="nd-text-h3">Revenue Generated</div>
                            <div className="nd-text-h4" style={{fontSize: '1.5rem', marginTop: '10px'}}>$59,342.32</div>
                         </div>
                         <Download size={20} color="#4cceac" />
                    </div>
                    <div style={{height: '250px', marginTop: '20px'}}>
                        <ReactECharts option={revenueOption} style={{height: '100%', width: '100%'}} />
                    </div>
                </div>
                
                <div className="nd-row-2-sm" style={{overflowY: 'auto'}}>
                    <div className="nd-text-h3" style={{borderBottom: '4px solid #141b2d', paddingBottom: '15px'}} >Recent Transactions</div>
                    {recentTransactions.map((tx, i) => (
                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '4px solid #141b2d'}}>
                            <div>
                                <div style={{color: '#4cceac', fontWeight: 'bold'}}>{tx.txId}</div>
                                <div>{tx.user}</div>
                            </div>
                            <div style={{}}>{tx.date}</div>
                            <div style={{backgroundColor: '#4cceac', padding: '5px 10px', borderRadius: '4px', color: '#141b2d', fontWeight: 'bold'}}>${tx.cost}</div>
                        </div>
                    ))}
                </div>

                 {/* Row 3 - Charts */}
                <div className="nd-row-3">
                    <div className="nd-text-h3" style={{alignSelf: 'flex-start'}}>Campaign</div>
                    <div style={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                         <div style={{height: '160px', width: '100%'}}>
                            <ReactECharts option={campaignOption} style={{height: '100%'}} />
                         </div>
                         <div style={{textAlign: 'center', marginTop: '10px'}}>
                            <div style={{color: '#4cceac', fontSize: '1.1rem'}}>$48,352 revenue generated</div>
                            <div style={{fontSize: '0.8rem'}}>Includes extra misc expenditures and costs</div>
                         </div>
                    </div>
                </div>

                 <div className="nd-row-3">
                    <div className="nd-text-h3" style={{alignSelf: 'flex-start'}}>Sales Quantity</div>
                     <div style={{height: '100%', width: '100%', marginTop: '10px'}}>
                            <ReactECharts option={salesOption} style={{height: '100%'}} />
                    </div>
                </div>

                 <div className="nd-row-3">
                    <div className="nd-text-h3" style={{alignSelf: 'flex-start'}}>Geography Based Traffic</div>
                    <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3'}}>
                        Map Data Visualization
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};

export default NewDashboard;
