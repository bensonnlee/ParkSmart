import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { 
  ArrowLeft, Clock, MapPin, Car, 
  ParkingCircle, Footprints, Bell, 
  Share2, Info, CheckCircle 
} from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { toast } from 'sonner';

export default function ParkingRecommendation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      // 模拟加载
      setTimeout(() => {
        setClassInfo({
          name: "EDGE COMPUTING CS 131",
          location: "Bourns Hall",
          room: "A632",
          startTime: new Date().setHours(11, 0, 0),
        });
        setLoading(false);
      }, 500);
    };
    fetchClassDetails();
  }, [id]);

  const tripDetails = { driveToCampus: 15, parkAtLot: 5, walkToClass: 8 };
  const totalTime = tripDetails.driveToCampus + tripDetails.parkAtLot + tripDetails.walkToClass;
  const leaveByTime = subMinutes(classInfo?.startTime || new Date(), totalTime);

  const recommendations = [
    {
      id: 'lot-30',
      name: 'Lot 30',
      status: 'good',
      currentSpots: 142,
      totalSpots: 800,
      walkingTime: 8,
      cost: 'Permit Gold',
      badge: 'BEST MATCH'
    },
    {
      id: 'lot-50',
      name: 'Lot 50',
      status: 'tight',
      currentSpots: 12,
      totalSpots: 450,
      walkingTime: 12,
      cost: 'Permit Gold',
      badge: 'VALUE'
    }
  ];

  if (loading) return <div className="p-10 text-center font-bold text-ucr-blue">Calculating best route...</div>;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* 修复后的固定 Header: 增加 z-50 和背景色，防止内容穿透 */}
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-50 h-24 flex items-center shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-ucr-blue"
              >
                <ArrowLeft className="size-6" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  {classInfo.name}
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="size-3 text-ucr-blue" />
                  {classInfo.location} • Room {classInfo.room}
                </p>
              </div>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-center">
               <p className="text-[8px] text-ucr-blue font-black uppercase tracking-widest">Class Starts</p>
               <p className="text-md font-bold text-gray-900">{format(classInfo.startTime, 'h:mm a')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域: pt-32 确保内容不会被固定的 header 挡住 */}
      <div className="container mx-auto px-4 pt-32 pb-12 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* 左侧栏: 离家时间与行程分解 (你喜欢的设计) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl bg-ucr-blue text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Car className="size-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">Recommended Departure</p>
                <div className="text-center mb-6">
                  <span className="text-6xl font-black tracking-tighter">
                    {format(leaveByTime, 'h:mm')}
                  </span>
                  <span className="text-xl font-bold ml-1 opacity-80 uppercase">
                    {format(leaveByTime, 'a')}
                  </span>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-xs font-medium mb-6 backdrop-blur-sm text-center">
                   Arrive 5 mins early to ensure a spot in {recommendations[0].name}.
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => toast.success("Reminder set!")}
                    className="flex-1 bg-ucr-gold hover:bg-yellow-500 text-blue-900 font-bold border-none"
                  >
                    <Bell className="size-4 mr-2" />
                    Notify Me
                  </Button>
                  <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white">
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-white">
              <CardContent className="p-6">
                <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-6 border-b pb-2">Trip Breakdown</h3>
                <div className="space-y-6">
                  {[
                    { icon: Car, label: 'Drive to UCR', time: tripDetails.driveToCampus },
                    { icon: ParkingCircle, label: 'Park & Pay', time: tripDetails.parkAtLot },
                    { icon: Footprints, label: 'Walk to Class', time: tripDetails.walkToClass },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="bg-gray-50 p-2.5 rounded-xl">
                        <step.icon className="size-4 text-ucr-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{step.label}</p>
                      </div>
                      <span className="font-black text-gray-900 text-sm">{step.time}m</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧栏: 停车场列表 */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 text-green-500" />
              Optimal Parking Lots
            </h3>

            {recommendations.map((lot) => (
              <Card key={lot.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-black text-xl text-gray-900">{lot.name}</h4>
                        <span className="bg-ucr-blue text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          {lot.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Footprints className="size-3" /> {lot.walkingTime} min walk
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Car className="size-3" /> {lot.cost}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Live Spots</p>
                       <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-2xl font-black text-gray-900">{lot.currentSpots}</span>
                          <span className="text-xs font-bold text-gray-400">/ {lot.totalSpots}</span>
                       </div>
                    </div>
                  </div>
                  
                  <Button className="w-full py-6 bg-white border border-gray-200 text-ucr-blue font-bold hover:bg-gray-50 rounded-xl transition-colors">
                    Open in Google Maps
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}