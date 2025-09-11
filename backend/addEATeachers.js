const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'sub_app',
  password: 'ea1785ea',
  database: 'scheduling_app',
};

// Teacher data
const teachers = [
  { first_name: 'Kris', last_name: 'Aldridge', email: 'Aldridge@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,History,Homeroom,Student Support Services,Faculty - History/Social Studies' },
  { first_name: 'Kyle', last_name: 'Atherholt', email: 'katherholt@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Lindsay', last_name: 'Baer', email: 'lbaer@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,World Languages' },
  { first_name: 'Jerome', last_name: 'Bailey', email: 'jbailey@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,History,Homeroom,Faculty - History/Social Studies' },
  { first_name: 'Jen', last_name: 'Barkofski', email: 'jbarkofski@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Language Arts' },
  { first_name: 'Anne', last_name: 'Barr', email: 'Abarr@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Elliot', last_name: 'Barr', email: 'ebarr@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Homeroom,Middle School' },
  { first_name: 'Catherine', last_name: 'Bennett', email: 'bennett@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Science,Faculty - Science' },
  { first_name: 'Colleen', last_name: 'Bernabei', email: 'Bernabei@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Physical Education-Health,Faculty - Health/PE' },
  { first_name: 'Jackie', last_name: 'Berry', email: 'jberry@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Erin', last_name: 'Bilbao', email: 'ebilbao@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom' },
  { first_name: 'John', last_name: 'Binstock', email: 'jbinstock@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Art,Homeroom,Student Support Services,Faculty - Visual/Performing Arts' },
  { first_name: 'Steve', last_name: 'Bosio', email: 'sbosio@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Classics,Homeroom,Middle School,Faculty - Classics' },
  { first_name: 'Amy', last_name: 'Brotschul', email: 'abrotschul@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services' },
  { first_name: 'Buffy', last_name: 'Brown', email: 'Bbrown@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Chuck', last_name: 'Bryant', email: 'Bryant@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,History,Homeroom,Student Support Services,Faculty - History/Social Studies' },
  { first_name: 'Kempley', last_name: 'Bryant', email: 'kbryant@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Kathleen', last_name: 'Bubas', email: 'kbubas@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Lee', last_name: 'Burnett', email: 'lburnett@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Classics,Homeroom,Middle School,Student Support Services,Faculty - Classics' },
  { first_name: 'Kristen', last_name: 'Calderon', email: 'kcalderon@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Maggie', last_name: 'Canavan', email: 'mcanavan@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,World Languages' },
  { first_name: 'Meghan', last_name: 'Cangi-Mammele', email: 'mcangi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Art' },
  { first_name: 'Sara', last_name: 'Capuzzi', email: 'scapuzzi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Julie', last_name: 'Choi', email: 'Choi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Art,Faculty - Visual/Performing Arts' },
  { first_name: 'Dan', last_name: 'Clay', email: 'dclay@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Theater and Dance' },
  { first_name: 'Cari', last_name: 'Cloud', email: 'cacloud@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services' },
  { first_name: 'Katie', last_name: 'Colyer', email: 'kcolyer@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Homeroom,Lilley Advanced Independent Study' },
  { first_name: 'Cheryl', last_name: 'Cossel', email: 'ccossel@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Shannon', last_name: 'Crowley', email: 'scrowley@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Computer Science,Athletics,Homeroom,Student Support Services' },
  { first_name: 'Amanda', last_name: 'Cusack', email: 'acusack@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Bri', last_name: 'Cuthbertson', email: 'bcuthbertson@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Ryan', last_name: 'Dankanich', email: 'rdankanich@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Music,Homeroom,Middle School,Faculty - Music' },
  { first_name: 'Matthew', last_name: 'Davis', email: 'mdavis@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Computer Science,Homeroom,Student Support Services,Lilley Advanced Independent Study' },
  { first_name: 'Cristina', last_name: 'Deirmengian', email: 'cdeirmengian@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services,Faculty - World Languages' },
  { first_name: 'Niall', last_name: 'Doherty', email: 'NDoherty@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Athletics,Homeroom,Middle School' },
  { first_name: 'Matt', last_name: 'Dotzman', email: 'mdotzman@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Theater and Dance' },
  { first_name: 'Claire', last_name: 'Dragwa', email: 'cdragwa@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Homeroom,Middle School' },
  { first_name: 'Heather', last_name: 'Dupont', email: 'hdupont@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,English,Homeroom,Middle School' },
  { first_name: 'Becky', last_name: 'Eckburg', email: 'reckburg@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Language Arts' },
  { first_name: 'Ellen', last_name: 'Erikson', email: 'eerikson@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Art' },
  { first_name: 'Jim', last_name: 'Erwin', email: 'jerwin@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Music,Homeroom' },
  { first_name: 'Jim', last_name: 'Farrell', email: 'Farrell@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Kim', last_name: 'Farrell', email: 'kfarrell@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics' },
  { first_name: 'James', last_name: 'Finegan', email: 'JFinegan@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Music,Homeroom,Middle School,Faculty - Music' },
  { first_name: 'Laurie', last_name: 'Finnical', email: 'LFinnical@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Science,Homeroom,Middle School' },
  { first_name: 'Brendan', last_name: 'FitzPatrick', email: 'Fitzpatr@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Homeroom' },
  { first_name: 'Kathryn', last_name: 'Fitzpatrick', email: 'kfitzpatrick@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics' },
  { first_name: 'Kathleen', last_name: 'Foster', email: 'foster@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Mathematics,Social Studies,Homeroom,Language Arts,Faculty - LS Homeroom' },
  { first_name: 'Andy', last_name: 'Fraggos', email: 'afraggos@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,History,Homeroom,Middle School' },
  { first_name: 'Keenan', last_name: 'Friend', email: 'kfriend@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Shaofang', last_name: 'Fu', email: 'sfu@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Homeroom,Middle School,Student Support Services' },
  { first_name: 'Christele', last_name: 'Furey', email: 'CFurey@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services,Faculty - World Languages' },
  { first_name: 'Tamika', last_name: 'Gamble', email: 'tgamble@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Tim', last_name: 'Gavin', email: 'TGavin@episcopalacademy.org', role: 'Teacher', departments: 'All School,Religion' },
  { first_name: 'Tom', last_name: 'Goebeler', email: 'TGoebeler@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Mathematics,Student Support Services,Homeroom,Lilley Advanced Independent Study' },
  { first_name: 'John', last_name: 'Goens', email: 'Goens@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,English,Homeroom,Middle School' },
  { first_name: 'Lauren', last_name: 'Golden', email: 'lgolden@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Athletics,Homeroom,Middle School' },
  { first_name: 'Sharon', last_name: 'Gooding-Reynolds', email: 'sreynolds@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Student Support Services,Homeroom' },
  { first_name: 'Lisa', last_name: 'Guzzo', email: 'lguzzo@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Karen', last_name: 'Hammacher', email: 'khammacher@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Sheli', last_name: 'Hay', email: 'shay@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Library,Homeroom,Middle School' },
  { first_name: 'Larry', last_name: 'Henderson', email: 'lhenderson@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,History,Homeroom,Middle School' },
  { first_name: 'Lisa', last_name: 'Herbster', email: 'LHerbster@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics' },
  { first_name: 'Tony', last_name: 'Herman', email: 'therman@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Catherine', last_name: 'Hicks', email: 'chicks@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Religion' },
  { first_name: 'Jonathan', last_name: 'Hill', email: 'jhill@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Computer Science,Homeroom,Middle School,Student Support Services' },
  { first_name: 'Bert', last_name: 'Howlin', email: 'Howlin@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,History,Homeroom,Middle School,Student Support Services,Faculty - History/Social Studies' },
  { first_name: 'Hilary', last_name: 'Hutchison', email: 'HHutchison@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Art,Homeroom,Student Support Services,Faculty - Visual/Performing Arts' },
  { first_name: 'Quincy', last_name: 'Hyson', email: 'Hyson@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Mathematics,Social Studies,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Sharon', last_name: 'Interrante', email: 'SInterrante@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Physical Education-Health,Faculty - Health/PE' },
  { first_name: 'Jay', last_name: 'Jennings', email: 'jjennings@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Lindsay', last_name: 'Jensen', email: 'ljensen@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Jenn', last_name: 'Jones', email: 'jjones@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Alison', last_name: 'Keffer', email: 'Keffer@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Max', last_name: 'Kelly', email: 'JKelly@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,History,Faculty - History/Social Studies' },
  { first_name: 'Steve', last_name: 'Kerwin', email: 'skerwin@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Science,Homeroom,Middle School,Faculty - Science' },
  { first_name: 'Ryan', last_name: 'Klein', email: 'rklein@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Mathematics' },
  { first_name: 'Brian', last_name: 'Kline', email: 'Kline@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Physical Education-Health' },
  { first_name: 'David', last_name: 'Knox', email: 'dknox@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Physical Education-Health,Faculty - Health/PE' },
  { first_name: 'Molly', last_name: 'Konopka', email: 'Konopka@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Classics,Homeroom,Student Support Services' },
  { first_name: 'Alyson', last_name: 'Kurz', email: 'akurz@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Student Services,History,Homeroom,Student Support Services' },
  { first_name: 'Damon', last_name: 'Kuzemka', email: 'DKuzemka@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Student Support Services,Faculty - History/Social Studies' },
  { first_name: 'Jennifer', last_name: 'Lee', email: 'jlee@episcopalacademy.org', role: 'Teacher', departments: 'All School,Lower School,Music,Instrumental' },
  { first_name: 'Kelly', last_name: 'Leight-Bertucci', email: 'kBertucci@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Theater and Dance,Student Support Services,Faculty - Visual/Performing Arts' },
  { first_name: 'Susie', last_name: 'Lim', email: 'slim@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Grace', last_name: 'Limaye', email: 'glimaye@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Science,Student Support Services,Homeroom,Faculty - Science,Lilley Advanced Independent Study' },
  { first_name: 'George', last_name: 'Lorenson', email: 'glorenson@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Iman', last_name: 'Loyola', email: 'iloyola@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Mark', last_name: 'Luff', email: 'Luff@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,English,Homeroom,Middle School' },
  { first_name: 'Nyazia', last_name: 'Martin', email: 'nmartin@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Middle School,Student Support Services' },
  { first_name: 'Ted', last_name: 'Mathisen', email: 'emathisen@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Computer Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Colleen', last_name: 'Matkowski', email: 'cmatkowski@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'CJ', last_name: 'McAnally', email: 'cmcanally@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,History,Homeroom,Middle School' },
  { first_name: 'Chris', last_name: 'McCreary', email: 'cmccreary@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Anna', last_name: 'McDermott', email: 'McDermot@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Student Services,History,Homeroom,Student Support Services' },
  { first_name: 'Maggie', last_name: 'McGill', email: 'mmcgill@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,English,Homeroom,Middle School,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Carrie', last_name: 'McGoldrick', email: 'cmcgoldrick@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Faculty - Mathematics,Athletics,Mathematics,Middle School,Homeroom' },
  { first_name: 'Mike', last_name: 'McNulty', email: 'mmcnulty@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Marie', last_name: 'McVeigh', email: 'mmcveigh@episcopalacademy.org', role: 'Teacher', departments: 'All School,Upper School,Athletics' },
  { first_name: 'Matt', last_name: 'Memmo', email: 'mmemmo@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Computer Science,Homeroom,Lilley Advanced Independent Study' },
  { first_name: 'David', last_name: 'Mercante', email: 'dmercante@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Student Support Services,Faculty - History/Social Studies' },
  { first_name: 'Meaghan', last_name: 'Montgomery', email: 'mmontgomery@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Athletics,Homeroom,Middle School' },
  { first_name: 'Steve', last_name: 'Morris', email: 'Morris@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Middle School,Athletics,Mathematics,Middle School,Homeroom' },
  { first_name: 'Lori', last_name: 'Moshyedi', email: 'lmoshyedi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Tracy', last_name: 'Motley', email: 'tmotley@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Mathematics,Homeroom' },
  { first_name: 'Angela', last_name: 'Mounce', email: 'amounce@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Eric', last_name: 'Mundy', email: 'emundy@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Adam', last_name: 'Murray', email: 'amurray@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Science' },
  { first_name: 'Tanuja', last_name: 'Murray', email: 'tmurray@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Mathematics' },
  { first_name: 'Matt', last_name: 'Newcomb', email: 'mnewcomb@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,English,Homeroom,Middle School,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Will', last_name: 'Newman', email: 'wnewman@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services' },
  { first_name: 'Debbie', last_name: 'Newnham', email: 'Newnham@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Music,Instrumental,Faculty - Music' },
  { first_name: 'Andrew', last_name: 'Newton', email: 'anewton@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Alice', last_name: 'Nicholson', email: 'anicholson@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Classics,Homeroom,Middle School' },
  { first_name: 'Carrie', last_name: 'Nielsen', email: 'cnielsen@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Science,Student Support Services,Homeroom' },
  { first_name: 'Ashley', last_name: "O'Connor", email: 'aoconnor@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Cheryl', last_name: 'Osmian', email: 'cosmian@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Michael', last_name: 'Palmisano', email: 'mpalmisano@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Religion,Athletics,Middle School' },
  { first_name: 'Doug', last_name: 'Parsons', email: 'dparsons@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Kim', last_name: 'Piersall', email: 'Piersall@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Health,Homeroom,Middle School' },
  { first_name: 'Kathy', last_name: 'Pizzi', email: 'KPizzi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,World Languages,Homeroom' },
  { first_name: 'Alyssa', last_name: 'Pohlig', email: 'apohlig@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Mathematics' },
  { first_name: 'Kristen', last_name: 'Powell', email: 'Kpowell@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Science,Athletics,Homeroom,Middle School' },
  { first_name: 'Whitaker', last_name: 'Powell', email: 'Wpowell@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Mathematics,Social Studies,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Jenny', last_name: 'Rea', email: 'rea@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom,Faculty - LS Homeroom' },
  { first_name: 'Julie', last_name: 'Reil', email: 'jreil@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,World Languages,Homeroom,Middle School' },
  { first_name: 'Christy', last_name: 'Rheam', email: 'CRheam@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Science,Student Support Services,Homeroom,Faculty - Science' },
  { first_name: 'Zach', last_name: 'Richards', email: 'ZRichards@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Religion' },
  { first_name: 'Rebecca', last_name: 'Rosenthal', email: 'rrosenthal@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Classics,Homeroom,Middle School' },
  { first_name: 'Abby', last_name: 'Ross', email: 'aross@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Topher', last_name: 'Row', email: 'CRow@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Student Support Services,Lilley Advanced Independent Study' },
  { first_name: 'Pamela', last_name: 'Rudolph', email: 'prudolph@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services,Faculty - World Languages' },
  { first_name: 'Melissa', last_name: 'Ruggiero', email: 'mruggiero@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Faculty - Mathematics,Mathematics,Middle School,Homeroom' },
  { first_name: 'Cat', last_name: 'Ryan', email: 'cryan@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Anna', last_name: 'Safford', email: 'asafford@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Lilley Advanced Independent Study' },
  { first_name: 'Lauren', last_name: 'Santangelo', email: 'lsantangelo@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Mathematics,Middle School,Homeroom' },
  { first_name: 'Cara', last_name: 'Saraco', email: 'csaraco@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Steve', last_name: 'Schuh', email: 'sschuh@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Faculty - History/Social Studies' },
  { first_name: 'Allison', last_name: 'Schultz', email: 'ASchultz@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Faculty - Mathematics,Mathematics,Middle School' },
  { first_name: 'Emily', last_name: 'Selfridge', email: 'eselfridge@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Science,Athletics,Homeroom,Middle School' },
  { first_name: 'Michael', last_name: 'Sheehan', email: 'msheehan@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,Religion,Student Support Services,Homeroom' },
  { first_name: 'Whedai', last_name: 'Sheriff', email: 'nsheriff@episcopalacademy.org', role: 'Teacher', departments: 'All School,Athletics,Faculty - Visual/Performing Arts' },
  { first_name: 'Andrew', last_name: 'Shimrock', email: 'ashimrock@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services,Faculty - World Languages' },
  { first_name: 'Kate', last_name: 'Siemon', email: 'kherron@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'David', last_name: 'Sigel', email: 'dsigel@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Art,Homeroom,Student Support Services,Faculty - Visual/Performing Arts' },
  { first_name: 'Holly', last_name: 'Silberman', email: 'hsilberman@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,English,Homeroom,Middle School' },
  { first_name: 'Ed', last_name: 'Silvi', email: 'Silvi@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Physical Education-Health,Faculty - Health/PE' },
  { first_name: 'Chuck', last_name: 'Simmonds', email: 'csimmonds@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Mathematics,Middle School,Homeroom' },
  { first_name: 'Gretchen', last_name: 'Simon', email: 'Simon@episcopalacademy.org', role: 'Teacher', departments: 'All School,Library' },
  { first_name: 'Chris', last_name: 'Slayton', email: 'cslayton@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Mathematics,Homeroom' },
  { first_name: 'Jessica', last_name: 'Smith', email: 'jesmith@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Rachel', last_name: 'Smith', email: 'rsmith@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Ron', last_name: 'Smith', email: 'rvsmith@episcopalacademy.org', role: 'Teacher', departments: 'All School,Upper School,Science,Student Support Services,Homeroom' },
  { first_name: 'Tyler', last_name: 'Smith', email: 'tsmith@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Music' },
  { first_name: 'Nicole', last_name: 'Squillario', email: 'nsquillario@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Mark', last_name: 'Stetina', email: 'mstetina@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,History,Homeroom,Middle School,Faculty - History/Social Studies' },
  { first_name: 'Kiley', last_name: 'Straub', email: 'kstraub@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Mathematics,Middle School,Student Support Services,Homeroom' },
  { first_name: 'Melanie', last_name: 'Subacus', email: 'msubacus@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Classics,Homeroom,Middle School' },
  { first_name: 'Celeste', last_name: 'Sweeney', email: 'CSweeney@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Science,Athletics,Homeroom,Middle School' },
  { first_name: 'Scott', last_name: 'Taylor', email: 'smtaylor@episcopalacademy.org', role: 'Teacher', departments: 'All School,Upper School' },
  { first_name: 'Lindsay', last_name: 'Tedesco', email: 'ltedesco@episcopalacademy.org', role: 'Teacher', departments: 'Lower School' },
  { first_name: 'Jennifer', last_name: 'Tierney', email: 'jtierney@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Gina', last_name: 'Tomkowich', email: 'GTomkowich@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Athletics,Theater and Dance,Homeroom,Middle School,Faculty - Visual/Performing Arts' },
  { first_name: 'Emily', last_name: 'Tucci', email: 'etucci@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Art,Homeroom,Middle School' },
  { first_name: 'Beth', last_name: 'Varga', email: 'bvarga@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Angelique', last_name: 'Villas', email: 'avillas@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Sarah', last_name: 'Wahlberg', email: 'swahlberg@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Classics,Homeroom,Middle School,Faculty - Classics' },
  { first_name: 'Zach', last_name: 'Ward', email: 'zward@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Homeroom' },
  { first_name: 'Michael', last_name: 'Whalen', email: 'mwhalen@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Student Support Services' },
  { first_name: 'Sam', last_name: 'Willis', email: 'swillis@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Lindsay', last_name: 'Woessner', email: 'lwoessner@episcopalacademy.org', role: 'Teacher', departments: 'Middle School,Music' },
  { first_name: 'Julia', last_name: 'Workman', email: 'jworkman@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,English,Homeroom,Student Support Services,Faculty - English/Language Arts' },
  { first_name: 'Taylor', last_name: 'Wright', email: 'jwright@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Athletics,History,Homeroom,Student Support Services' },
  { first_name: 'Vicki', last_name: 'Wylam', email: 'vwylam@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Homeroom' },
  { first_name: 'Mireya', last_name: 'Yaros', email: 'Yaros@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Faculty - World Languages' },
  { first_name: 'Danielle', last_name: 'Yeager', email: 'dyeager@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Athletics,Homeroom' },
  { first_name: 'Meg', last_name: 'Yeaton', email: 'myeaton@episcopalacademy.org', role: 'Teacher', departments: 'Lower School,Library' },
  { first_name: 'CJ', last_name: 'Yespelkis', email: 'CYespelkis@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,Faculty - Mathematics,Athletics,Mathematics,Student Support Services,Homeroom' },
  { first_name: 'Ke', last_name: 'Yi', email: 'kyi@episcopalacademy.org', role: 'Teacher', departments: 'Upper School,World Languages,Homeroom,Student Support Services,Faculty - World Languages' },
];

// Function to create table and insert data
async function insertUsers() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role ENUM('Teacher', 'Substitute') NOT NULL,
        departments TEXT NOT NULL
      )
    `);
    console.log('Users table created or already exists');

    // Prepare insert query
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, role, departments)
      VALUES (?, ?, ?, ?, ?)
    `;

    // Insert each teacher
    for (const teacher of teachers) {
      await connection.execute(insertQuery, [
        teacher.first_name,
        teacher.last_name,
        teacher.email,
        teacher.role,
        teacher.departments,
      ]);
      console.log(`Inserted ${teacher.first_name} ${teacher.last_name}`);
    }

    console.log('All users inserted successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

insertUsers();