import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import '../widgets/chat_bubble.dart';
import 'letter_preview_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {
      'isUser': false,
      'text': 'আসসালামু আলাইকুম! আমি আপনার আইন-বন্ধু। আপনার শ্রম আইন সংক্রান্ত কোনো সমস্যা থাকলে আমাকে বলুন। আপনি ভয়েস মেসেজও দিতে পারেন।',
      'time': 'এখন'
    },
  ];
  bool _isTyping = false;

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;
    
    setState(() {
      _messages.add({
        'isUser': true,
        'text': _controller.text,
        'time': 'এখন'
      });
      _isTyping = true;
    });

    _controller.clear();

    // Simulating AI response
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({
            'isUser': false,
            'text': 'আপনার সমস্যাটি আমি বুঝতে পেরেছি। শ্রম আইন ২০০৬ অনুযায়ী, আপনার বকেয়া বেতন আদায়ের আইনি অধিকার আছে। আমি কি একটি অভিযোগ পত্র ড্রাফট করে দেব?',
            'time': 'এখন',
            'showAction': true,
          });
        });
      }
    });
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'png'],
    );

    if (result != null) {
      setState(() {
        _messages.add({
          'isUser': true,
          'text': 'একটি ফাইল আপলোড করা হয়েছে: ${result.files.single.name}',
          'time': 'এখন',
          'isFile': true,
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('আইন বন্ধু', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            Text('সব সময় আপনার পাশে', style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return FadeInUp(
                  duration: const Duration(milliseconds: 300),
                  child: Column(
                    children: [
                      ChatBubble(
                        isUser: msg['isUser'],
                        text: msg['text'],
                        time: msg['time'],
                        isFile: msg['isFile'] ?? false,
                      ),
                      if (msg['showAction'] == true)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => const LetterPreviewScreen()),
                              );
                            },
                            icon: const Icon(Icons.description),
                            label: const Text('অভিযোগ পত্র দেখুন'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange.shade800,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          if (_isTyping)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  SpinKitThreeBounce(color: Theme.of(context).colorScheme.primary, size: 20),
                  const SizedBox(width: 10),
                  const Text('আইন বন্ধু লিখছে...', style: TextStyle(fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          _buildQuickSuggestions(),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildQuickSuggestions() {
    final suggestions = [
      {'label': 'বেতন পাচ্ছিনা', 'icon': Icons.money_off},
      {'label': 'ছুটি দিচ্ছে না', 'icon': Icons.event_busy},
      {'label': 'ছাঁটাই করেছে', 'icon': Icons.person_remove},
      {'label': 'অগ্নি নিরাপত্তা', 'icon': Icons.local_fire_department},
      {'label': 'খারাপ ব্যবহার', 'icon': Icons.gavel},
    ];

    return Container(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: suggestions.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: FadeInRight(
              delay: Duration(milliseconds: 100 * index),
              child: ActionChip(
                avatar: Icon(suggestions[index]['icon'] as IconData, size: 16, color: Colors.teal.shade700),
                label: Text(suggestions[index]['label'] as String),
                onPressed: () {
                  _controller.text = suggestions[index]['label'] as String;
                  _sendMessage();
                },
                backgroundColor: Colors.teal.shade50,
                side: BorderSide(color: Colors.teal.shade100),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.attach_file, color: Colors.grey),
              onPressed: _pickFile,
            ),
            IconButton(
              icon: const Icon(FontAwesomeIcons.microphone, color: Colors.redAccent),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('ভয়েস রেকর্ডার চালু হচ্ছে...')),
                );
              },
            ),
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: InputDecoration(
                  hintText: 'এখানে লিখুন...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
