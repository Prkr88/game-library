import json
class L:
    def __init__(s,W,H,name,par):
        s.W,s.H,s.name,s.par=W,H,name,par
        s.g=[['.']*W for _ in range(H)]
    def put(s,c,n,ch):
        s.g[s.H-1-n][c]=ch
    def G(s,c0,c1,n=3):
        for c in range(c0,c1+1):
            for k in range(n): s.put(c,k,'#')
    def B(s,c0,c1,n0,n1,ch='#'):
        for c in range(c0,c1+1):
            for k in range(n0,n1+1): s.put(c,k,ch)
    def sp(s,c0,c1,n,ch='^'):
        for c in range(c0,c1+1): s.put(c,n,ch)
    def rows(s): return [''.join(r) for r in s.g]
levels=[]
# L1
l=L(56,9,'First Steps',14)
l.G(0,10);l.G(13,19);l.G(23,32);l.G(36,55)
l.put(16,3,'#');l.sp(29,30,3);l.B(44,45,3,4)
l.put(1,3,'S');l.put(53,3,'E')
for c,n in [(11,5),(21,5),(30,6),(34,5),(44,6)]: l.put(c,n,'o')
l.put(8,3,'C') if False else None
levels.append(l)
# L2 spikes & stairs
l=L(64,10,'Spike Row',17)
l.G(0,8);l.G(11,16);l.G(17,19,4);l.G(20,22,5);l.G(23,40);l.G(44,50);l.G(53,63)
l.sp(26,27,5);l.sp(31,33,5);l.sp(37,38,5)
l.sp(46,47,3) if False else None
l.sp(45,46,3) if False else None
l.sp(47,48,3)
l.B(56,57,3,4); l.sp(59,60,3)
l.put(1,3,'S');l.put(61,3,'E')
for c,n in [(14,5),(21,8),(27,8),(32,8),(37,8),(48,6),(57,6)]: l.put(c,n,'o')
l.put(0,0,'#')
levels.append(l)
import json
class L:
    def __init__(s,W,H,name,par):
        s.W,s.H,s.name,s.par=W,H,name,par
        s.g=[['.']*W for _ in range(H)]
    def put(s,c,n,ch):
        s.g[s.H-1-n][c]=ch
    def G(s,c0,c1,n=3):
        for c in range(c0,c1+1):
            for k in range(n): s.put(c,k,'#')
    def B(s,c0,c1,n0,n1,ch='#'):
        for c in range(c0,c1+1):
            for k in range(n0,n1+1): s.put(c,k,ch)
    def sp(s,c0,c1,n,ch='^'):
        for c in range(c0,c1+1): s.put(c,n,ch)
    def rows(s): return [''.join(r) for r in s.g]
levels=[]
# L1
l=L(56,9,'First Steps',14)
l.G(0,10);l.G(13,19);l.G(23,32);l.G(36,55)
l.put(16,3,'#');l.sp(29,30,3);l.B(44,45,3,4)
l.put(1,3,'S');l.put(53,3,'E')
for c,n in [(11,5),(21,5),(30,6),(34,5),(44,6)]: l.put(c,n,'o')
l.put(8,3,'C') if False else None
levels.append(l)
# L2 spikes & stairs
l=L(64,10,'Spike Row',17)
l.G(0,8);l.G(11,16);l.G(17,19,4);l.G(20,22,5);l.G(23,40);l.G(44,50);l.G(53,63)
l.sp(26,27,5);l.sp(31,33,5);l.sp(37,38,5)
l.sp(46,47,3) if False else None
l.sp(45,46,3) if False else None
l.sp(47,48,3)
l.B(56,57,3,4); l.sp(59,60,3)
l.put(1,3,'S');l.put(61,3,'E')
for c,n in [(14,5),(21,8),(27,8),(32,8),(37,8),(48,6),(57,6)]: l.put(c,n,'o')
l.put(0,0,'#')
levels.append(l)
# L3 pads
l=L(64,14,'Spring Break',16)
l.G(0,9);l.put(9,3,'J')
l.G(13,17,8)
l.G(21,33);l.sp(24,25,3);l.sp(28,29,3);l.put(33,3,'J')
l.G(37,41,8)
l.G(45,63);l.sp(48,49,3);l.sp(52,53,3);l.sp(56,57,3)
l.put(1,3,'S');l.put(61,3,'E')
for c,n in [(15,10),(39,10),(26,7),(50,6),(54,6)]: l.put(c,n,'o')
levels.append(l)
# L4 saws
l=L(70,10,'Buzzsaw Alley',18)
l.G(0,69)
l.put(1,3,'S')
l.put(18,3,'W');l.put(30,3,'W')
l.sp(40,41,3);l.put(46,4,'W');l.put(56,3,'W');l.put(60,3,'W')
l.B(64,65,3,4);l.put(68,3,'E')
for c,n in [(18,7),(30,7),(46,8),(58,7)]: l.put(c,n,'o')
levels.append(l)
# L5 shaft
l=L(24,22,'The Shaft',12)
l.G(0,23)
l.B(0,0,3,20);l.B(4,4,3,16)
l.G(5,12,17)
l.put(2,3,'S');l.put(9,17,'E')
for n in (7,10,13,16): l.put(2,n,'o')
levels.append(l)
# L6 vertical saws + checkpoints
l=L(76,12,'Pendulum Run',20)
l.G(0,21);l.G(25,43);l.G(47,75)
l.put(1,3,'S')
for c in (12,17,30,35,39): l.put(c,5,'V')
l.put(33,3,'C');l.put(51,3,'C')
l.put(53,6,'Z');l.put(58,5,'V');l.put(62,6,'Z');l.sp(65,66,3);l.put(69,5,'V');l.put(72,6,'Z')
l.put(74,3,'E')
for c,n in [(14,7),(23,6),(45,6),(55,8),(60,8)]: l.put(c,n,'o')
levels.append(l)
# L7 low ceiling
l=L(80,13,'Low Ceiling',20)
l.G(0,13);l.G(17,34);l.G(37,52);l.G(56,79)
l.B(0,79,9,12)
for c in (8,9,20,21,28,29,41,42,43,60,61,70,71): l.put(c,8,'~')
l.put(12,3,'J');l.put(30,3,'W')
l.sp(24,25,3);l.sp(48,49,3);l.sp(65,66,3);l.put(74,4,'W')
l.put(1,3,'S');l.put(77,3,'E')
for c,n in [(15,6),(32,6),(45,6),(68,6)]: l.put(c,n,'o')
levels.append(l)

# L8 gauntlet
l=L(96,14,'Gauntlet',25)
l.G(0,12);l.G(16,24);l.put(24,3,'J');l.G(28,32,8);l.G(36,50);l.G(70,95)
l.put(1,3,'S');l.put(7,3,'W');l.put(30,12,'Z')
l.put(37,3,'C');l.sp(40,41,3);l.put(45,3,'W');l.put(48,4,'W')
for c,h in ((54,4),(58,5),(62,4),(66,5)): l.G(c,c,h)
l.put(56,7,'V');l.put(64,8,'V')
l.put(71,3,'C');l.sp(74,75,3);l.put(79,3,'w');l.put(86,3,'w');l.sp(89,90,3);l.put(93,3,'E')
for c,n in [(14,6),(30,10),(43,7),(60,8),(82,7)]: l.put(c,n,'o')
levels.append(l)
# L9 needle shaft
l=L(40,28,'Needle Shaft',16)
l.G(0,39)
l.B(0,0,3,26);l.B(4,4,3,23)
l.G(5,18,24)
for n in (9,14,19): l.put(2,n,'W')
l.put(2,3,'S')
l.G(21,25,24) if False else None
l.put(15,24,'E')
l.sp(8,9,24)
for n in (7,12,17,22): l.put(2,n,'o')
levels.append(l)
# L10 glitch core
l=L(120,16,'Glitch Core',38)
l.G(0,14);l.put(1,3,'S');l.put(8,3,'W');l.put(12,3,'J')
l.G(19,23,9);l.put(21,13,'Z')
l.G(28,44);l.put(29,3,'C');l.sp(32,33,3);l.put(37,4,'W');l.put(41,3,'W')
# ceiling tunnel with pad hops
l.B(46,60,10,15)
l.G(48,62)
for c in (50,51,56,57): l.put(c,9,'~')
l.put(53,3,'J');l.sp(54,55,3) if False else None
l.sp(58,59,3)
# pillar bridge with saws
for c,h in ((66,5),(70,6),(74,4),(78,6),(82,5)): l.G(c,c,h)
l.put(68,8,'V');l.put(76,8,'Z');l.put(80,9,'V')
l.G(86,119);l.put(87,3,'C');l.sp(91,92,3);l.put(96,3,'w');l.put(103,4,'W');l.sp(100,101,3);l.put(108,3,'W');l.put(111,3,'W')
l.B(113,114,3,4);l.put(117,3,'E')
for c,n in [(21,11),(39,8),(53,8),(74,7),(96,7),(104,7)]: l.put(c,n,'o')
levels.append(l)

out=[{'name':lv.name,'par':lv.par,'rows':lv.rows()} for lv in levels]
open('/tmp/gh/levels.json','w').write(json.dumps(out))
import sys
if len(sys.argv)>1:
    for lv in levels:
        print(lv.name)
        for r in lv.rows(): print(r)
